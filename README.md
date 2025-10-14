# Quantum Entanglement of a Binary Qubit System

This project demonstrates the creation, simulation, and visualization of quantum entanglement between two qubits (representing binary electron spins) using Qiskit and Python.

## Overview

Quantum entanglement is a fundamental phenomenon in quantum mechanics where two or more particles become linked and share quantum states, such that the state of one particle instantly influences the state of the other, no matter the distance between them. This property is a cornerstone for quantum computing, quantum cryptography, and teleportation.

In this repository, the entanglement between two qubits is generated and analyzed as a Bell state:
\[
|\Phi^+\rangle = \frac{1}{\sqrt{2}}(|00\rangle + |11\rangle)
\]
where `|00>` and `|11>` represent binary states of two electrons or spins[web:65][web:54][web:29].

## Features

- Builds a quantum circuit initializing two qubits in the Bell state
- Uses Qiskit Aer for quantum circuit simulation
- Displays measurement results as histograms
- Visualizes quantum statevectors for entangled states

## Getting Started

### Prerequisites

- Python 3.8+
- Qiskit (v1.0+)
- Matplotlib

Install dependencies:


pip install qiskit , matplotlib , qiskit_aer , qiskit_ibm_runtime





### Usage

Run the following code in a Python environment or Jupyter notebook:


## Results

- **Measurement outcomes:** Only `|00>` and `|11>` states appear, with near-equal probabilities, confirming quantum entanglement.
- **Statevector visualization:** Shows the symmetric superposition of both qubits.

## References

- [IBM Quantum Qiskit Documentation][web:54]
- [Visualizing Quantum Results][web:65]
- [Quantum Entanglement Theory][web:29]



---

Contributions and improvements are welcome!

