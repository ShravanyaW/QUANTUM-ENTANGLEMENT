import { useState } from "react";
import "@/App.css";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Play, Plus, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [numQubits, setNumQubits] = useState(2);
  const [shots, setShots] = useState(1024);
  const [gates, setGates] = useState([{ type: "h", target: 0 }, { type: "cx", control: 0, target: 1 }]);
  const [results, setResults] = useState(null);
  const [stateVector, setStateVector] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("circuit");

  const addGate = (gateType) => {
    const newGate = { type: gateType };
    
    if (["h", "x", "y", "z"].includes(gateType)) {
      newGate.target = 0;
    } else if (["cx", "cz", "swap"].includes(gateType)) {
      newGate.control = 0;
      newGate.target = 1;
    }
    
    setGates([...gates, newGate]);
    toast.success(`Added ${gateType.toUpperCase()} gate`);
  };

  const updateGate = (index, field, value) => {
    const newGates = [...gates];
    newGates[index][field] = parseInt(value);
    setGates(newGates);
  };

  const removeGate = (index) => {
    const newGates = gates.filter((_, i) => i !== index);
    setGates(newGates);
    toast.info("Gate removed");
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/quantum/simulate`, {
        num_qubits: numQubits,
        gates: gates,
        shots: shots
      });
      setResults(response.data);
      toast.success("Simulation completed!");
      setActiveTab("results");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Simulation failed");
    } finally {
      setLoading(false);
    }
  };

  const getStateVector = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/quantum/state-vector`, {
        num_qubits: numQubits,
        gates: gates
      });
      setStateVector(response.data);
      toast.success("State vector computed!");
      setActiveTab("statevector");
    } catch (error) {
      toast.error(error.response?.data?.detail || "State vector computation failed");
    } finally {
      setLoading(false);
    }
  };

  const exportStateVector = () => {
    if (!stateVector) return;
    
    const dataStr = JSON.stringify(stateVector, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'state_vector.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success("State vector exported!");
  };

  const resetCircuit = () => {
    setGates([{ type: "h", target: 0 }, { type: "cx", control: 0, target: 1 }]);
    setResults(null);
    setStateVector(null);
    setActiveTab("circuit");
    toast.info("Circuit reset");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Quantum Entanglement Lab</h1>
              <p className="text-sm text-slate-400 mt-1">Interactive quantum circuit simulator with Qiskit</p>
            </div>
            <Badge variant="outline" className="text-cyan-400 border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm">
              {numQubits} Qubits • {shots} Shots
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Circuit Configuration */}
            <Card className="bg-slate-900/50 border-slate-800" data-testid="circuit-config-card">
              <CardHeader>
                <CardTitle className="text-slate-100">Circuit Configuration</CardTitle>
                <CardDescription>Configure quantum circuit parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Number of Qubits</label>
                  <Select value={numQubits.toString()} onValueChange={(v) => setNumQubits(parseInt(v))} data-testid="qubit-selector">
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Qubits</SelectItem>
                      <SelectItem value="3">3 Qubits</SelectItem>
                      <SelectItem value="4">4 Qubits</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Measurement Shots</label>
                  <Select value={shots.toString()} onValueChange={(v) => setShots(parseInt(v))} data-testid="shots-selector">
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="512">512</SelectItem>
                      <SelectItem value="1024">1024</SelectItem>
                      <SelectItem value="2048">2048</SelectItem>
                      <SelectItem value="4096">4096</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Gate Selection */}
            <Card className="bg-slate-900/50 border-slate-800" data-testid="gate-selection-card">
              <CardHeader>
                <CardTitle className="text-slate-100">Add Gates</CardTitle>
                <CardDescription>Build your quantum circuit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-xs text-slate-400 mb-3">Single-Qubit Gates</div>
                  <div className="grid grid-cols-4 gap-2">
                    {["h", "x", "y", "z"].map((gate) => (
                      <Button
                        key={gate}
                        onClick={() => addGate(gate)}
                        variant="outline"
                        className="bg-slate-800 border-slate-700 hover:bg-cyan-500/20 hover:border-cyan-500 text-slate-100 font-mono"
                        data-testid={`add-${gate}-gate`}
                      >
                        {gate.toUpperCase()}
                      </Button>
                    ))}
                  </div>

                  <div className="text-xs text-slate-400 mb-3 mt-4">Two-Qubit Gates</div>
                  <div className="grid grid-cols-3 gap-2">
                    {["cx", "cz", "swap"].map((gate) => (
                      <Button
                        key={gate}
                        onClick={() => addGate(gate)}
                        variant="outline"
                        className="bg-slate-800 border-slate-700 hover:bg-cyan-500/20 hover:border-cyan-500 text-slate-100 font-mono text-xs"
                        data-testid={`add-${gate}-gate`}
                      >
                        {gate.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-slate-900/50 border-slate-800" data-testid="actions-card">
              <CardContent className="pt-6 space-y-3">
                <Button 
                  onClick={runSimulation} 
                  disabled={loading || gates.length === 0}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                  data-testid="run-simulation-btn"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {loading ? "Simulating..." : "Run Simulation"}
                </Button>
                <Button 
                  onClick={getStateVector} 
                  disabled={loading || gates.length === 0}
                  variant="outline"
                  className="w-full bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-100"
                  data-testid="get-statevector-btn"
                >
                  Get State Vector
                </Button>
                <Button 
                  onClick={resetCircuit} 
                  variant="outline"
                  className="w-full bg-slate-800 border-slate-700 hover:bg-red-900/30 hover:border-red-500 text-slate-100"
                  data-testid="reset-circuit-btn"
                >
                  Reset Circuit
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Display Area */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border-slate-800" data-testid="main-display-card">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <CardHeader>
                  <TabsList className="grid w-full grid-cols-3 bg-slate-800">
                    <TabsTrigger value="circuit" className="data-[state=active]:bg-cyan-600" data-testid="circuit-tab">Circuit</TabsTrigger>
                    <TabsTrigger value="results" className="data-[state=active]:bg-cyan-600" data-testid="results-tab">Results</TabsTrigger>
                    <TabsTrigger value="statevector" className="data-[state=active]:bg-cyan-600" data-testid="statevector-tab">State Vector</TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent className="min-h-[600px]">
                  <TabsContent value="circuit" className="mt-0" data-testid="circuit-content">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-100">Gates Sequence</h3>
                        <Badge variant="outline" className="text-slate-300">{gates.length} gates</Badge>
                      </div>
                      
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                        {gates.map((gate, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700" data-testid={`gate-${index}`}>
                            <Badge className="bg-cyan-600 text-white font-mono">{gate.type.toUpperCase()}</Badge>
                            
                            {["h", "x", "y", "z"].includes(gate.type) ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-400">Target:</span>
                                <Select 
                                  value={gate.target.toString()} 
                                  onValueChange={(v) => updateGate(index, "target", v)}
                                  data-testid={`gate-${index}-target`}
                                >
                                  <SelectTrigger className="w-20 bg-slate-700 border-slate-600 text-slate-100">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[...Array(numQubits)].map((_, i) => (
                                      <SelectItem key={i} value={i.toString()}>q{i}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-slate-400">Control:</span>
                                  <Select 
                                    value={gate.control.toString()} 
                                    onValueChange={(v) => updateGate(index, "control", v)}
                                    data-testid={`gate-${index}-control`}
                                  >
                                    <SelectTrigger className="w-20 bg-slate-700 border-slate-600 text-slate-100">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[...Array(numQubits)].map((_, i) => (
                                        <SelectItem key={i} value={i.toString()}>q{i}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <ChevronRight className="w-4 h-4 text-cyan-400" />
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-slate-400">Target:</span>
                                  <Select 
                                    value={gate.target.toString()} 
                                    onValueChange={(v) => updateGate(index, "target", v)}
                                    data-testid={`gate-${index}-target`}
                                  >
                                    <SelectTrigger className="w-20 bg-slate-700 border-slate-600 text-slate-100">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[...Array(numQubits)].map((_, i) => (
                                        <SelectItem key={i} value={i.toString()}>q{i}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                            
                            <Button
                              onClick={() => removeGate(index)}
                              variant="ghost"
                              size="sm"
                              className="ml-auto text-red-400 hover:text-red-300 hover:bg-red-900/20"
                              data-testid={`remove-gate-${index}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="results" className="mt-0" data-testid="results-content">
                    {results ? (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-100 mb-3">Quantum Circuit</h3>
                          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                            <img 
                              src={`data:image/png;base64,${results.circuit_diagram}`} 
                              alt="Quantum Circuit" 
                              className="w-full"
                              data-testid="circuit-diagram"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-slate-100 mb-3">Measurement Histogram</h3>
                          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                            <img 
                              src={`data:image/png;base64,${results.histogram}`} 
                              alt="Measurement Results" 
                              className="w-full"
                              data-testid="histogram"
                            />
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-slate-100 mb-3">Measurement Counts</h3>
                          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {Object.entries(results.counts).map(([state, count]) => (
                                <div key={state} className="bg-slate-700/50 rounded p-3 text-center">
                                  <div className="font-mono text-cyan-400 text-lg">|{state}⟩</div>
                                  <div className="text-slate-300 text-sm mt-1">{count} ({((count/results.total_shots)*100).toFixed(1)}%)</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-96 text-slate-400">
                        <div className="text-center">
                          <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Run simulation to see results</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="statevector" className="mt-0" data-testid="statevector-content">
                    {stateVector ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-slate-100">State Vector</h3>
                          <Button 
                            onClick={exportStateVector}
                            variant="outline"
                            size="sm"
                            className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-100"
                            data-testid="export-statevector-btn"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export JSON
                          </Button>
                        </div>

                        {stateVector.bloch_spheres?.length > 0 && (
                          <div>
                            <h4 className="text-md font-semibold text-slate-200 mb-3">Bloch Sphere Visualization</h4>
                            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                              <img 
                                src={`data:image/png;base64,${stateVector.bloch_spheres[0]}`} 
                                alt="Bloch Sphere" 
                                className="w-full"
                                data-testid="bloch-sphere"
                              />
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="text-md font-semibold text-slate-200 mb-3">State Amplitudes</h4>
                          <div className="bg-slate-800/50 rounded-lg border border-slate-700 max-h-96 overflow-y-auto">
                            <table className="w-full">
                              <thead className="bg-slate-700/50 sticky top-0">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">State</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Amplitude</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Magnitude</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Probability</th>
                                </tr>
                              </thead>
                              <tbody>
                                {stateVector.state_vector.map((item, index) => (
                                  <tr key={index} className="border-t border-slate-700">
                                    <td className="px-4 py-3 font-mono text-cyan-400">|{item.state}⟩</td>
                                    <td className="px-4 py-3 font-mono text-sm text-slate-300">
                                      {item.amplitude_real.toFixed(4)} {item.amplitude_imag >= 0 ? '+' : ''} {item.amplitude_imag.toFixed(4)}i
                                    </td>
                                    <td className="px-4 py-3 font-mono text-sm text-slate-300">{item.magnitude.toFixed(4)}</td>
                                    <td className="px-4 py-3 text-slate-300">
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-slate-700 h-2 rounded-full overflow-hidden">
                                          <div 
                                            className="bg-cyan-500 h-full" 
                                            style={{width: `${item.probability * 100}%`}}
                                          ></div>
                                        </div>
                                        <span className="text-xs font-mono">{(item.probability * 100).toFixed(1)}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-96 text-slate-400">
                        <div className="text-center">
                          <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Compute state vector to see amplitudes</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
