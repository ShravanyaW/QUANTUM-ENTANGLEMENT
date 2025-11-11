from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any
import uuid
from datetime import datetime, timezone
import io
import base64
import json

# Qiskit imports
from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer
from qiskit.quantum_info import Statevector
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class QuantumCircuitRequest(BaseModel):
    num_qubits: int = Field(ge=2, le=5)
    gates: List[Dict[str, Any]]
    shots: int = Field(ge=512, le=8192)

class StateVectorRequest(BaseModel):
    num_qubits: int = Field(ge=2, le=5)
    gates: List[Dict[str, Any]]


# Helper functions
def create_circuit(num_qubits: int, gates: List[Dict[str, Any]]) -> QuantumCircuit:
    """Create a quantum circuit from gate specifications"""
    qc = QuantumCircuit(num_qubits)
    
    for gate in gates:
        gate_type = gate['type']
        target = gate.get('target')
        control = gate.get('control')
        
        if gate_type == 'h':
            qc.h(target)
        elif gate_type == 'x':
            qc.x(target)
        elif gate_type == 'y':
            qc.y(target)
        elif gate_type == 'z':
            qc.z(target)
        elif gate_type == 'cx' and control is not None:
            qc.cx(control, target)
        elif gate_type == 'cz' and control is not None:
            qc.cz(control, target)
        elif gate_type == 'swap' and control is not None:
            qc.swap(control, target)
    
    return qc

def plot_to_base64(fig) -> str:
    """Convert matplotlib figure to base64 string"""
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', dpi=150, facecolor='#0a0a0b')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    return img_base64


# Routes
@api_router.get("/")
async def root():
    return {"message": "Quantum Entanglement API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


@api_router.post("/quantum/simulate")
async def simulate_quantum_circuit(request: QuantumCircuitRequest):
    """Simulate a quantum circuit and return visualization data"""
    try:
        # Create circuit
        qc = create_circuit(request.num_qubits, request.gates)
        qc.measure_all()
        
        # Generate circuit diagram
        fig_circuit = qc.draw('mpl', style={'backgroundcolor': '#0a0a0b'})
        circuit_img = plot_to_base64(fig_circuit)
        
        # Simulate
        backend = Aer.get_backend('qasm_simulator')
        transpiled_circuit = transpile(qc, backend)
        job = backend.run(transpiled_circuit, shots=request.shots)
        result = job.result()
        counts = result.get_counts()
        
        # Create histogram
        fig_hist, ax = plt.subplots(figsize=(10, 6), facecolor='#0a0a0b')
        ax.set_facecolor('#0a0a0b')
        
        states = list(counts.keys())
        values = list(counts.values())
        
        bars = ax.bar(states, values, color='#06b6d4', edgecolor='#22d3ee', linewidth=1.5)
        ax.set_xlabel('Quantum State', fontsize=12, color='#e5e7eb')
        ax.set_ylabel('Counts', fontsize=12, color='#e5e7eb')
        ax.set_title('Measurement Results', fontsize=14, fontweight='bold', color='#f9fafb')
        ax.tick_params(colors='#e5e7eb')
        ax.spines['bottom'].set_color('#374151')
        ax.spines['left'].set_color('#374151')
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.grid(True, alpha=0.1, color='#4b5563')
        
        histogram_img = plot_to_base64(fig_hist)
        
        return {
            "circuit_diagram": circuit_img,
            "histogram": histogram_img,
            "counts": counts,
            "total_shots": request.shots
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@api_router.post("/quantum/state-vector")
async def get_state_vector(request: StateVectorRequest):
    """Get the state vector of a quantum circuit"""
    try:
        # Create circuit without measurement
        qc = create_circuit(request.num_qubits, request.gates)
        
        # Get state vector
        state = Statevector.from_instruction(qc)
        state_dict = state.to_dict()
        
        # Format state vector for display
        formatted_states = []
        for basis_state, amplitude in state_dict.items():
            magnitude = abs(amplitude)
            phase = np.angle(amplitude)
            
            if magnitude > 1e-10:  # Filter out negligible amplitudes
                formatted_states.append({
                    "state": basis_state,
                    "amplitude_real": float(amplitude.real),
                    "amplitude_imag": float(amplitude.imag),
                    "magnitude": float(magnitude),
                    "phase": float(phase),
                    "probability": float(magnitude ** 2)
                })
        
        # Sort by probability
        formatted_states.sort(key=lambda x: x['probability'], reverse=True)
        
        # Generate Bloch sphere visualization (for single qubit states)
        bloch_imgs = []
        if request.num_qubits <= 3:
            try:
                from qiskit.visualization import plot_bloch_multivector
                fig_bloch = plot_bloch_multivector(state)
                fig_bloch.patch.set_facecolor('#0a0a0b')
                bloch_img = plot_to_base64(fig_bloch)
                bloch_imgs.append(bloch_img)
            except:
                pass
        
        return {
            "state_vector": formatted_states,
            "num_states": len(formatted_states),
            "bloch_spheres": bloch_imgs
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
