from fastapi import FastAPI, HTTPException, Request
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from rdkit import Chem
import requests
import urllib.parse

# --- NEW PYTORCH IMPORTS ---
import torch
import torch.nn.functional as F
from torch_geometric.nn import GCNConv, global_mean_pool
from torch_geometric.data import Data

# 1. Initialize the FastAPI Application
app = FastAPI(title="CodeCure Toxicity Predictor")
templates = Jinja2Templates(directory="templates")

class MoleculeInput(BaseModel):
    smiles: str

# 2. THE GNN ARCHITECTURE (Copied from your friend's notebook)
class Tox21GNN(torch.nn.Module):
    def __init__(self, hidden_dim=64):
        super(Tox21GNN, self).__init__()
        self.conv1 = GCNConv(1, hidden_dim)
        self.conv2 = GCNConv(hidden_dim, hidden_dim * 2)
        self.conv3 = GCNConv(hidden_dim * 2, hidden_dim * 4)
        self.fc1 = torch.nn.Linear(hidden_dim * 4, 128)
        self.fc2 = torch.nn.Linear(128, 12) # Outputs all 12 Tox21 targets

    def forward(self, x, edge_index, batch):
        x = F.relu(self.conv1(x, edge_index))
        x = F.relu(self.conv2(x, edge_index))
        x = self.conv3(x, edge_index)
        x = global_mean_pool(x, batch)
        x = F.relu(self.fc1(x))
        x = self.fc2(x) 
        return x

# 3. LOAD THE PYTORCH MODEL
print("Loading GNN Toxicity Model...")
try:
    # Initialize the architecture
    toxicity_model = Tox21GNN()
    # Load the weights (state_dict) from the file you zipped up
    toxicity_model.load_state_dict(torch.load('tox21_final_model.pth.zip', map_location=torch.device('cpu'), weights_only=True))
    toxicity_model.eval() # Set to evaluation mode (turns off training features)
    print("✅ PyTorch GNN Loaded Successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")

# 4. SMILES TO GRAPH CONVERTER
def smiles_to_graph(smiles_string: str):
    clean_smiles = smiles_string.strip()
    mol = Chem.MolFromSmiles(clean_smiles)
    if mol is None:
        raise ValueError("Invalid SMILES string provided.")
    
    # Nodes (Atoms)
    node_features = [[atom.GetAtomicNum()] for atom in mol.GetAtoms()]
    x = torch.tensor(node_features, dtype=torch.float)
    
    # Edges (Bonds)
    edges = []
    for bond in mol.GetBonds():
        i = bond.GetBeginAtomIdx()
        j = bond.GetEndAtomIdx()
        edges.append([i, j])
        edges.append([j, i])
        
    edge_index = torch.tensor(edges, dtype=torch.long).t().contiguous() if edges else torch.empty((2, 0), dtype=torch.long)
    
    return Data(x=x, edge_index=edge_index)

def get_compound_name(smiles: str) -> str:
    try:
        # Step 1: Convert to RDKit Molecule
        mol = Chem.MolFromSmiles(smiles.strip())
        if mol is None:
            return "Unknown Compound"

        # Step 2: Generate the universal InChIKey
        inchikey = Chem.MolToInchiKey(mol)
        
        # Step 3: Ask PubChem specifically for the 'Title' property!
        url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/inchikey/{inchikey}/property/Title/JSON"
        
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            # Navigate the new JSON structure to grab the official title
            return data['PropertyTable']['Properties'][0]['Title']
        else:
            print(f"PubChem couldn't find InChIKey: {inchikey}")
            return "Unknown / Novel Compound"
            
    except Exception as e:
        print(f"PubChem API Error: {e}")
        return "Unknown / Novel Compound"

# 5. API ROUTES
@app.get("/")
async def serve_frontend(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

@app.post("/predict")
async def predict_toxicity(request: MoleculeInput):
    try:
        # Step A: Convert to PyTorch Graph
        graph_data = smiles_to_graph(request.smiles)
        
        # We need a "batch" vector of 0s because we are only passing 1 molecule at a time
        batch = torch.zeros(graph_data.x.size(0), dtype=torch.long)
        
        # Step B: Make the GNN Prediction
        with torch.no_grad(): # Don't calculate gradients (saves memory)
            logits = toxicity_model(graph_data.x, graph_data.edge_index, batch)
            
            # The model outputs 12 targets. 'SR-p53' is the 12th one (index 11).
            # We apply a sigmoid function to turn the raw logit into a percentage (0.0 to 1.0)
            risk_probability = float(torch.sigmoid(logits[0, 11]).item())
        
        # Step C: Determine the risk level
        risk_level = "High Risk" if risk_probability > 0.7 else "Medium Risk" if risk_probability > 0.4 else "Low Risk"

        compound_name = get_compound_name(request.smiles)

        return {
            "status": "success",
            "compound_name": compound_name,
            "smiles_analyzed": request.smiles,
            "toxicity_risk_score": round(risk_probability, 4),
            "risk_level": risk_level,
            "message": "Prediction generated by Team CodeCure's Graph Neural Network."
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error")