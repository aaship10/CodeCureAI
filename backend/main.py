# from fastapi import FastAPI, Depends, HTTPException, Header
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.security import OAuth2PasswordRequestForm
# from pydantic import BaseModel
# from sqlalchemy.orm import Session
# from datetime import timedelta
# from typing import Optional
# from jose import jwt
# import os
# import time
# import requests

# from rdkit import Chem
# from rdkit.Chem import Descriptors
# from chembl_webresource_client.new_client import new_client

# import torch
# import torch.nn.functional as F
# from torch_geometric.nn import GCNConv, global_mean_pool, global_max_pool
# from torch_geometric.data import Data

# # --- CORRECTED IMPORTS ---
# import models
# import schemas
# import auth

# # Now we specifically pull the classes we need for type hints and logic
# from models import User
# from auth import get_current_user
# from database import engine, get_db
# # -------------------------


# # 1. INITIALIZE APP & DATABASE
# models.Base.metadata.create_all(bind=engine)
# app = FastAPI(title="CodeCure Toxicity Predictor")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"], 
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# class MoleculeInput(BaseModel):
#     smiles: str

# # 2. THE GNN ARCHITECTURE & LOADING
# class Tox21GNN(torch.nn.Module):
#     def __init__(self, hidden_dim=64):
#         super(Tox21GNN, self).__init__()
#         self.conv1 = GCNConv(1, hidden_dim)
#         self.conv2 = GCNConv(hidden_dim, hidden_dim * 2)
#         self.conv3 = GCNConv(hidden_dim * 2, hidden_dim * 4)
#         self.fc1 = torch.nn.Linear((hidden_dim * 4) * 2, 128)
#         self.fc2 = torch.nn.Linear(128, 12) 

#     def forward(self, x, edge_index, batch):
#         x = F.relu(self.conv1(x, edge_index))
#         x = F.relu(self.conv2(x, edge_index))
#         x = self.conv3(x, edge_index)
#         x_mean = global_mean_pool(x, batch) 
#         x_max = global_max_pool(x, batch) 
#         x = torch.cat([x_mean, x_max], dim=1)
#         x = F.dropout(x, p=0.3, training=self.training)
#         x = F.relu(self.fc1(x))
#         x = F.dropout(x, p=0.3, training=self.training)
#         x = self.fc2(x) 
#         return x

# print("Loading Advanced GNN Toxicity Model...")
# try:
#     toxicity_model = Tox21GNN()
#     toxicity_model.load_state_dict(torch.load('tox21_final_model.pth', map_location=torch.device('cpu'), weights_only=True))
#     toxicity_model.eval() 
#     print("✅ PyTorch GNN Loaded Successfully!")
# except Exception as e:
#     print(f"❌ Error loading model: {e}")

# # 3. HELPER FUNCTIONS
# def smiles_to_graph(smiles_string: str):
#     clean_smiles = smiles_string.strip()
#     mol = Chem.MolFromSmiles(clean_smiles)
#     if mol is None:
#         raise ValueError("Invalid SMILES string provided.")
#     node_features = [[atom.GetAtomicNum()] for atom in mol.GetAtoms()]
#     x = torch.tensor(node_features, dtype=torch.float)
#     edges = []
#     for bond in mol.GetBonds():
#         i = bond.GetBeginAtomIdx()
#         j = bond.GetEndAtomIdx()
#         edges.append([i, j])
#         edges.append([j, i])
#     edge_index = torch.tensor(edges, dtype=torch.long).t().contiguous() if edges else torch.empty((2, 0), dtype=torch.long)
#     return Data(x=x, edge_index=edge_index)

# def get_compound_data(smiles: str):
#     try:
#         mol = Chem.MolFromSmiles(smiles.strip())
#         if mol is None: return "Unknown Compound", None
#         inchikey = Chem.MolToInchiKey(mol)
#         url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/inchikey/{inchikey}/property/Title/JSON"
#         for attempt in range(3):
#             try:
#                 response = requests.get(url, headers={'Connection': 'close'}, timeout=5)
#                 if response.status_code == 200:
#                     data = response.json()
#                     return data['PropertyTable']['Properties'][0]['Title'], data['PropertyTable']['Properties'][0].get('CID')
#                 else: return "Unknown / Novel Compound", None
#             except requests.exceptions.RequestException:
#                 if attempt == 2: raise
#                 time.sleep(1) 
#     except Exception:
#         return "Unknown / Novel Compound", None

# def get_chembl_data(compound_name: str, smiles: str):
#     try:
#         molecule = new_client.molecule
#         fields_to_pull = ['molecule_chembl_id', 'max_phase', 'molecule_type', 'black_box_warning', 'withdrawn_flag', 'first_approval', 'molecule_properties', 'indication_class']
#         mols = molecule.filter(molecule_structures__canonical_smiles=smiles).only(fields_to_pull)
#         if not mols and compound_name != "Unknown / Novel Compound":
#             mols = molecule.filter(pref_name__iexact=compound_name).only(fields_to_pull)
#         if mols:
#             data = mols[0]
#             props = data.get('molecule_properties') or {}
#             return {
#                 "id": data.get('molecule_chembl_id', 'Unregistered'),
#                 "max_phase": data.get('max_phase', 0),
#                 "type": data.get('molecule_type', 'Unknown'),
#                 "black_box_warning": data.get('black_box_warning', False),
#                 "withdrawn": data.get('withdrawn_flag', False),
#                 "approval_year": data.get('first_approval', 'N/A'),
#                 "indication": data.get('indication_class', 'Unknown'),
#                 "psa": props.get('psa', 'N/A'),
#                 "qed_score": props.get('qed_weighted', 'N/A')
#             }
#     except Exception as e: print(f"ChEMBL API Error: {e}")
#     return {"id": "Unregistered", "max_phase": 0, "type": "Novel / Uncatalogued"}

# # 4. AUTHENTICATION ROUTES
# @app.post("/api/signup", response_model=schemas.UserResponse)
# def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
#     db_user = db.query(models.User).filter(models.User.email == user.email).first()
#     if db_user: raise HTTPException(status_code=400, detail="Email already registered")
    
#     hashed_password = auth.get_password_hash(user.password)
#     new_user = models.User(full_name=user.full_name, email=user.email, hashed_password=hashed_password)
#     db.add(new_user)
#     db.commit()
#     db.refresh(new_user)
#     return new_user

# @app.post("/api/login", response_model=schemas.Token)
# def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
#     user = db.query(models.User).filter(models.User.email == form_data.username).first()
#     if not user or not auth.verify_password(form_data.password, user.hashed_password):
#         raise HTTPException(status_code=401, detail="Incorrect email or password")
    
#     access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
#     access_token = auth.create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
#     return {"access_token": access_token, "token_type": "bearer"}

# # 5. CORE APP ROUTES
# @app.post("/api/predict")
# async def predict_toxicity(
#     request: MoleculeInput,
#     db: Session = Depends(get_db),
#     authorization: Optional[str] = Header(None)
# ):
#     try:
#         # ML Logic
#         graph_data = smiles_to_graph(request.smiles)
#         batch = torch.zeros(graph_data.x.size(0), dtype=torch.long)
#         with torch.no_grad():
#             logits = toxicity_model(graph_data.x, graph_data.edge_index, batch)
#             risk_probability = float(torch.sigmoid(logits[0, 11]).item())
        
#         risk_level = "High Risk" if risk_probability > 0.7 else "Medium Risk" if risk_probability > 0.4 else "Low Risk"
#         compound_name, cid = get_compound_data(request.smiles)

#         mol = Chem.MolFromSmiles(request.smiles.strip())
#         weight = Descriptors.MolWt(mol)
#         logp = Descriptors.MolLogP(mol)
#         h_donors = Descriptors.NumHDonors(mol)
#         h_acceptors = Descriptors.NumHAcceptors(mol)
#         lipinski_pass = (weight <= 500) and (logp <= 5) and (h_donors <= 5) and (h_acceptors <= 10)

#         chembl_info = get_chembl_data(compound_name, request.smiles.strip())

#         response_data = {
#             "status": "success",
#             "compound_name": compound_name,
#             "cid": cid,
#             "smiles_analyzed": request.smiles,
#             "toxicity_risk_score": round(risk_probability, 4),
#             "risk_level": risk_level,
#             "pharmacokinetics": {
#                 "weight": round(weight, 2), "logp": round(logp, 2),
#                 "h_donors": h_donors, "h_acceptors": h_acceptors,
#                 "lipinski_pass": lipinski_pass
#             },
#             "chembl": chembl_info
#         }

#         # Hybrid Auth Saving (Now correctly mapped to models.Prediction)
#         if authorization and authorization.startswith("Bearer "):
#             token = authorization.split(" ")[1]
#             try:
#                 SECRET_KEY = os.getenv("SECRET_KEY")
#                 ALGORITHM = os.getenv("ALGORITHM", "HS256")
#                 payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#                 user_email = payload.get("sub")
                
#                 if user_email:
#                     user = db.query(models.User).filter(models.User.email == user_email).first()
#                     if user:
#                         new_prediction = models.Prediction(
#                             user_id=user.id,
#                             smiles_string=request.smiles,
#                             prediction_result=risk_level,
#                             confidence_score=round(risk_probability, 4)
#                         )
#                         db.add(new_prediction)
#                         db.commit()
#             except Exception as e:
#                 print(f"Auth skip: {e}")

#         return response_data

#     except ValueError as e: raise HTTPException(status_code=400, detail=str(e))
#     except Exception as e: raise HTTPException(status_code=500, detail="Internal Server Error")

# @app.get("/api/history", response_model=list[schemas.PredictionResponse])
# def get_history(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
#     history = db.query(models.Prediction).filter(models.Prediction.user_id == current_user.id).order_by(models.Prediction.timestamp.desc()).all()
#     return history



# import csv
# import io
# from fastapi import UploadFile, File

# # 6. ENTERPRISE BATCH PROCESSING HELPER (Updated for Reliability)
# async def save_to_history_db(db: Session, user_id: int, smiles: str, risk_level: str, toxicity_score: float):
#     try:
#         new_prediction = models.Prediction(
#             user_id=user_id,
#             smiles_string=smiles,
#             prediction_result=risk_level,
#             confidence_score=toxicity_score
#         )
#         db.add(new_prediction)
#         db.commit() # This pushes it to Neon
#     except Exception as e:
#         db.rollback()
#         print(f"❌ Neon DB Error: {e}")

# @app.post("/api/predict-batch")
# async def predict_batch(
#     file: UploadFile = File(...), 
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     try:
#         content = await file.read()
#         decoded = content.decode('utf-8')
#         reader = csv.reader(io.StringIO(decoded))
        
#         results = []
#         for row in reader:
#             if not row: continue
#             smiles = row[0].strip()
#             if not smiles or smiles.lower() == 'smiles': continue 
            
#             try:
#                 # 1. Basic Info & ML Prediction
#                 compound_name, cid = get_compound_data(smiles)
#                 graph_data = smiles_to_graph(smiles)
#                 batch = torch.zeros(graph_data.x.size(0), dtype=torch.long)
                
#                 with torch.no_grad():
#                     logits = toxicity_model(graph_data.x, graph_data.edge_index, batch)
#                     risk_prob = float(torch.sigmoid(logits[0, 11]).item())
                
#                 risk_level = "High Risk" if risk_prob > 0.7 else "Medium Risk" if risk_prob > 0.4 else "Low Risk"

#                 # 2. ADDED: Pharmacokinetics (Rule of 5)
#                 mol = Chem.MolFromSmiles(smiles)
#                 pk_data = {
#                     "weight": round(Descriptors.MolWt(mol), 2),
#                     "logp": round(Descriptors.MolLogP(mol), 2),
#                     "h_donors": Descriptors.NumHDonors(mol),
#                     "h_acceptors": Descriptors.NumHAcceptors(mol),
#                     "lipinski_pass": (Descriptors.MolWt(mol) <= 500 and Descriptors.MolLogP(mol) <= 5)
#                 }

#                 # 3. ADDED: ChEMBL Data
#                 chembl_info = get_chembl_data(compound_name, smiles)
                
#                 res_obj = {
#                     "compound_name": compound_name,
#                     "cid": cid, # Needed for 3D Viewer
#                     "smiles": smiles,
#                     "risk_score": round(risk_prob, 4),
#                     "risk_level": risk_level,
#                     "pharmacokinetics": pk_data,
#                     "chembl": chembl_info,
#                     "status": "Success"
#                 }
#                 results.append(res_obj)

#                 # Save to history
#                 await save_to_history_db(db, current_user.id, smiles, risk_level, res_obj['risk_score'])

#             except Exception as e:
#                 results.append({"compound_name": "Error", "smiles": smiles, "status": "Error"})
                
#         return {"batch_results": results}

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


from fastapi import FastAPI, Depends, HTTPException, status, Header, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional
from jose import jwt
import os
import time
import requests
import csv
import io

from rdkit import Chem
from rdkit.Chem import Descriptors
from chembl_webresource_client.new_client import new_client

import torch
import torch.nn.functional as F
from torch_geometric.nn import GCNConv, global_mean_pool, global_max_pool
from torch_geometric.data import Data

# --- CORRECTED IMPORTS ---
import models
import schemas
import auth

# Now we specifically pull the classes we need for type hints and logic
from models import User
from auth import get_current_user
from database import engine, get_db
# -------------------------

# 1. INITIALIZE APP & DATABASE
models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="CodeCure Toxicity Predictor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MoleculeInput(BaseModel):
    smiles: str

# 2. THE GNN ARCHITECTURE & LOADING
class Tox21GNN(torch.nn.Module):
    def __init__(self, hidden_dim=64):
        super(Tox21GNN, self).__init__()
        self.conv1 = GCNConv(1, hidden_dim)
        self.conv2 = GCNConv(hidden_dim, hidden_dim * 2)
        self.conv3 = GCNConv(hidden_dim * 2, hidden_dim * 4)
        self.fc1 = torch.nn.Linear((hidden_dim * 4) * 2, 128)
        self.fc2 = torch.nn.Linear(128, 12) 

    def forward(self, x, edge_index, batch):
        x = F.relu(self.conv1(x, edge_index))
        x = F.relu(self.conv2(x, edge_index))
        x = self.conv3(x, edge_index)
        x_mean = global_mean_pool(x, batch) 
        x_max = global_max_pool(x, batch) 
        x = torch.cat([x_mean, x_max], dim=1)
        x = F.dropout(x, p=0.3, training=self.training)
        x = F.relu(self.fc1(x))
        x = F.dropout(x, p=0.3, training=self.training)
        x = self.fc2(x) 
        return x

print("Loading Advanced GNN Toxicity Model...")
try:
    toxicity_model = Tox21GNN()
    toxicity_model.load_state_dict(torch.load('tox21_final_model.pth', map_location=torch.device('cpu'), weights_only=True))
    toxicity_model.eval() 
    print("✅ PyTorch GNN Loaded Successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")

# 3. HELPER FUNCTIONS
def smiles_to_graph(smiles_string: str):
    clean_smiles = smiles_string.strip()
    mol = Chem.MolFromSmiles(clean_smiles)
    if mol is None:
        raise ValueError("Invalid SMILES string provided.")
    node_features = [[atom.GetAtomicNum()] for atom in mol.GetAtoms()]
    x = torch.tensor(node_features, dtype=torch.float)
    edges = []
    for bond in mol.GetBonds():
        i = bond.GetBeginAtomIdx()
        j = bond.GetEndAtomIdx()
        edges.append([i, j])
        edges.append([j, i])
    edge_index = torch.tensor(edges, dtype=torch.long).t().contiguous() if edges else torch.empty((2, 0), dtype=torch.long)
    return Data(x=x, edge_index=edge_index)

def get_compound_data(smiles: str):
    try:
        mol = Chem.MolFromSmiles(smiles.strip())
        if mol is None: return "Unknown Compound", None
        inchikey = Chem.MolToInchiKey(mol)
        url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/inchikey/{inchikey}/property/Title/JSON"
        for attempt in range(3):
            try:
                response = requests.get(url, headers={'Connection': 'close'}, timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    return data['PropertyTable']['Properties'][0]['Title'], data['PropertyTable']['Properties'][0].get('CID')
                else: return "Unknown / Novel Compound", None
            except requests.exceptions.RequestException:
                if attempt == 2: raise
                time.sleep(1) 
    except Exception:
        return "Unknown / Novel Compound", None

def get_chembl_data(compound_name: str, smiles: str):
    try:
        molecule = new_client.molecule
        fields_to_pull = ['molecule_chembl_id', 'max_phase', 'molecule_type', 'black_box_warning', 'withdrawn_flag', 'first_approval', 'molecule_properties', 'indication_class']
        mols = molecule.filter(molecule_structures__canonical_smiles=smiles).only(fields_to_pull)
        if not mols and compound_name != "Unknown / Novel Compound":
            mols = molecule.filter(pref_name__iexact=compound_name).only(fields_to_pull)
        if mols:
            data = mols[0]
            props = data.get('molecule_properties') or {}
            return {
                "id": data.get('molecule_chembl_id', 'Unregistered'),
                "max_phase": data.get('max_phase', 0),
                "type": data.get('molecule_type', 'Unknown'),
                "black_box_warning": data.get('black_box_warning', False),
                "withdrawn": data.get('withdrawn_flag', False),
                "approval_year": data.get('first_approval', 'N/A'),
                "indication": data.get('indication_class', 'Unknown'),
                "psa": props.get('psa', 'N/A'),
                "qed_score": props.get('qed_weighted', 'N/A')
            }
    except Exception as e: print(f"ChEMBL API Error: {e}")
    return {"id": "Unregistered", "max_phase": 0, "type": "Novel / Uncatalogued"}

# 4. AUTHENTICATION ROUTES
@app.post("/api/signup", response_model=schemas.Token)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user: 
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and save user
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        full_name=user.full_name, 
        email=user.email, 
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Automatically generate an access token so they enter the site immediately
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": new_user.email}, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

# 5. CORE APP ROUTES
@app.post("/api/predict")
async def predict_toxicity(
    request: MoleculeInput,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    try:
        # ML Logic
        graph_data = smiles_to_graph(request.smiles)
        batch = torch.zeros(graph_data.x.size(0), dtype=torch.long)
        with torch.no_grad():
            logits = toxicity_model(graph_data.x, graph_data.edge_index, batch)
            risk_probability = float(torch.sigmoid(logits[0, 11]).item())
        
        risk_level = "High Risk" if risk_probability > 0.7 else "Medium Risk" if risk_probability > 0.4 else "Low Risk"
        compound_name, cid = get_compound_data(request.smiles)

        mol = Chem.MolFromSmiles(request.smiles.strip())
        weight = Descriptors.MolWt(mol)
        logp = Descriptors.MolLogP(mol)
        h_donors = Descriptors.NumHDonors(mol)
        h_acceptors = Descriptors.NumHAcceptors(mol)
        lipinski_pass = (weight <= 500) and (logp <= 5) and (h_donors <= 5) and (h_acceptors <= 10)

        chembl_info = get_chembl_data(compound_name, request.smiles.strip())

        response_data = {
            "status": "success",
            "compound_name": compound_name,
            "cid": cid,
            "smiles_analyzed": request.smiles,
            "toxicity_risk_score": round(risk_probability, 4),
            "risk_level": risk_level,
            "pharmacokinetics": {
                "weight": round(weight, 2), "logp": round(logp, 2),
                "h_donors": h_donors, "h_acceptors": h_acceptors,
                "lipinski_pass": lipinski_pass
            },
            "chembl": chembl_info
        }

        # Hybrid Auth Saving
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            try:
                SECRET_KEY = os.getenv("SECRET_KEY")
                ALGORITHM = os.getenv("ALGORITHM", "HS256")
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                user_email = payload.get("sub")
                
                if user_email:
                    user = db.query(models.User).filter(models.User.email == user_email).first()
                    if user:
                        new_prediction = models.Prediction(
                            user_id=user.id,
                            smiles_string=request.smiles,
                            prediction_result=risk_level,
                            confidence_score=round(risk_probability, 4)
                        )
                        db.add(new_prediction)
                        db.commit()
            except Exception as e:
                print(f"Auth skip: {e}")

        return response_data

    except ValueError as e: raise HTTPException(status_code=400, detail=str(e))
    except Exception as e: raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/api/history", response_model=list[schemas.PredictionResponse])
def get_history(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    history = db.query(models.Prediction).filter(models.Prediction.user_id == current_user.id).order_by(models.Prediction.timestamp.desc()).all()
    return history

# 6. ENTERPRISE BATCH PROCESSING HELPER
async def save_to_history_db(db: Session, user_id: int, smiles: str, risk_level: str, toxicity_score: float):
    try:
        new_prediction = models.Prediction(
            user_id=user_id,
            smiles_string=smiles,
            prediction_result=risk_level,
            confidence_score=toxicity_score
        )
        db.add(new_prediction)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"❌ Neon DB Error: {e}")

@app.post("/api/predict-batch")
async def predict_batch(
    file: UploadFile = File(...), 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        content = await file.read()
        decoded = content.decode('utf-8')
        reader = csv.reader(io.StringIO(decoded))
        
        results = []
        for row in reader:
            if not row: continue
            smiles = row[0].strip()
            if not smiles or smiles.lower() == 'smiles': continue 
            
            try:
                compound_name, cid = get_compound_data(smiles)
                graph_data = smiles_to_graph(smiles)
                batch = torch.zeros(graph_data.x.size(0), dtype=torch.long)
                
                with torch.no_grad():
                    logits = toxicity_model(graph_data.x, graph_data.edge_index, batch)
                    risk_prob = float(torch.sigmoid(logits[0, 11]).item())
                
                risk_level = "High Risk" if risk_prob > 0.7 else "Medium Risk" if risk_prob > 0.4 else "Low Risk"

                mol = Chem.MolFromSmiles(smiles)
                pk_data = {
                    "weight": round(Descriptors.MolWt(mol), 2),
                    "logp": round(Descriptors.MolLogP(mol), 2),
                    "h_donors": Descriptors.NumHDonors(mol),
                    "h_acceptors": Descriptors.NumHAcceptors(mol),
                    "lipinski_pass": (Descriptors.MolWt(mol) <= 500 and Descriptors.MolLogP(mol) <= 5)
                }

                chembl_info = get_chembl_data(compound_name, smiles)
                
                res_obj = {
                    "compound_name": compound_name,
                    "cid": cid,
                    "smiles": smiles,
                    "risk_score": round(risk_prob, 4),
                    "risk_level": risk_level,
                    "pharmacokinetics": pk_data,
                    "chembl": chembl_info,
                    "status": "Success"
                }
                results.append(res_obj)

                await save_to_history_db(db, current_user.id, smiles, risk_level, res_obj['risk_score'])

            except Exception as e:
                results.append({"compound_name": "Error", "smiles": smiles, "status": "Error"})
                
        return {"batch_results": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))