# 🧬 CodeCure AI | Deep Learning for Drug Toxicity
[![Live Demo] - https://codecure-frontend.vercel.app/
## 🚀 Overview
CodeCure AI is an end-to-end bioinformatics web application built for predicting compound toxicity in the early stages of drug discovery. Instead of relying on slow in-vitro testing, CodeCure utilizes a state-of-the-art **PyTorch Geometric Graph Neural Network (GNN)** to map the 3D atomic structure of novel compounds and predict cellular stress and DNA damage probabilities.

## ✨ Core Features
* **Deep Graph Neural Network:** Analyzes topological molecular structures rather than flat text, trained on the NIH Tox21 dataset (specifically targeting the SR-p53 cellular stress pathway).
* **Live PubChem Integration:** Automatically converts user-input SMILES strings into universal InChIKeys to fetch official compound data and CIDs directly from the US Government's PubChem database, featuring a self-healing retry loop to bypass rate limits.
* **Real-Time 3D Rendering:** Generates fully interactive, rotatable 3D molecular structures in the browser using `3Dmol.js`.
* **Pharmacokinetics Dashboard:** Instantly calculates Lipinski's "Rule of 5" (Molecular Weight, LogP, Hydrogen Donors/Acceptors) via RDKit to determine human absorption viability.
* **Sleek Glassmorphism UI:** Built with React and Tailwind CSS for a frictionless, commercial-grade user experience.

## 🛠️ Tech Stack
* **Backend:** Python, FastAPI, Uvicorn
* **AI/ML:** PyTorch, PyTorch Geometric, Scikit-Learn
* **Bioinformatics:** RDKit
* **Frontend:** React.js, Tailwind CSS, 3Dmol.js

## 🔬 Scientific Disclaimer (The SR-p53 Pathway)
This model is specifically fine-tuned to predict toxicity along the **SR-p53 bioassay pathway** (which measures DNA damage and cellular stress leading to mutations). 
* **Known Limitation:** Compounds that are highly lethal but do not damage DNA (e.g., *Fentanyl*, which causes respiratory depression) will correctly score a "Low Risk" on this specific p53 pathway. 
* **Future Scope:** Implementing ensemble models to capture distinct systemic and neurological toxicities beyond SR-p53.

## 💻 How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/aaship10/CodeCureAI
   cd CodeCure-Hackathon
