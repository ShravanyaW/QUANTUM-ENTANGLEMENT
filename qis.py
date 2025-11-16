from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
from qiskit.visualization import plot_histogram
# 1. BUILD your quantum circuit
qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.measure([0, 1], [0, 1])

# 2. RUN the experiment on a backend
backend = AerSimulator()
def q(s):
    job = backend.run(qc, shots=s) # This returns a 'job' object
    result = job.result()             # This waits for the job to finish and gets the 'result' object

    # 3. GET THE DICTIONARY from the result 🎯
    counts = result.get_counts(qc)
    return plot_histogram(counts)