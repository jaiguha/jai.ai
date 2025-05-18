import React, { useState, useRef } from 'react';
import { File, Upload, Play, ChevronDown, ChevronRight, AlertCircle, CheckCircle, Info } from 'lucide-react';
import AnalysisResultsViewer from './AnalysisResultsViewer';
import './AnalysisResultsViewer.css';

const ABAPAnalyzer = () => {
  // State management
  const [files, setFiles] = useState([]);
  const [analysisSettings, setAnalysisSettings] = useState({
    agents: ['functionality', 'technical', 'logic', 'context'],
    model: 'claude-3-7-sonnet-20250219',
    outputFormat: 'json',
    apiKey: '',
    provider: 'anthropic',
    apiBaseUrl: ''
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [configLoaded, setConfigLoaded] = useState(false);
  const [configError, setConfigError] = useState(null);

  const fileInputRef = useRef(null);

  // Fetch API configuration from backend on component mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/config');
        
        if (!response.ok) {
          throw new Error('Failed to load configuration');
        }
        
        const config = await response.json();
        
        setAnalysisSettings(prev => ({
          ...prev,
          apiKey: config.apiKey || '',
          provider: config.apiProvider || 'anthropic',
          model: config.modelName || 'claude-3-7-sonnet-20250219',
          apiBaseUrl: config.apiBaseUrl || ''
        }));
        
        setConfigLoaded(true);
      } catch (err) {
        console.error('Error loading configuration:', err);
        setConfigError(err.message);
      }
    };
    
    fetchConfig();
  }, []);

  // Available agents
  const availableAgents = [
    { id: 'functionality', label: 'Functionality', description: 'Analyzes business purpose and functional aspects' },
    { id: 'technical', label: 'Technical', description: 'Examines technical implementation details' },
    { id: 'logic', label: 'Logic', description: 'Extracts core logic and algorithm patterns' },
    { id: 'context', label: 'Context', description: 'Maintains relationships between code segments' },
    { id: 'documentation', label: 'Documentation', description: 'Analyzes code documentation quality' },
    { id: 'security', label: 'Security', description: 'Identifies security issues and best practices' }
  ];

  // File upload handler
  const handleFileUpload = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const abapFiles = selectedFiles.filter(file => 
      file.name.endsWith('.abap') || file.name.endsWith('.ABAP')
    );
    
    if (abapFiles.length === 0) {
      setError('Please select ABAP files (.abap extension)');
      return;
    }
    
    setFiles(prevFiles => [...prevFiles, ...abapFiles]);
    setError(null);
  };

  // Remove file
  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Toggle agent selection
  const toggleAgent = (agentId) => {
    setAnalysisSettings(prev => ({
      ...prev,
      agents: prev.agents.includes(agentId)
        ? prev.agents.filter(id => id !== agentId)
        : [...prev.agents, agentId]
    }));
  };

  // Run analysis
  const runAnalysis = async () => {
    if (files.length === 0) {
      setError('Please upload at least one ABAP file');
      return;
    }

    if (!analysisSettings.apiKey) {
      setError('Please provide an API key in settings');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Create FormData
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('settings', JSON.stringify(analysisSettings));

      // Make API call to backend
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const results = await response.json();
      setAnalysisResults(results);
    } catch (err) {
      setError(`Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle section expansion
  const toggleSection = (sectionName) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ABAP Code Analyzer</h1>
              <p className="text-sm text-gray-600 mt-1">Analyze ABAP code with AI-powered insights</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Settings */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Configuration</h2>
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    configLoaded && analysisSettings.apiKey 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {configLoaded && analysisSettings.apiKey 
                      ? 'Environment Configuration Loaded' 
                      : 'Waiting for Configuration...'}
                  </span>
                </div>
              </div>
              
              {/* Environment Configuration Status */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Environment Status</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="text-gray-600">API Provider:</span>
                    <span className="font-medium">{analysisSettings.provider}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-600">Model:</span>
                    <span className="font-medium">{analysisSettings.model}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-600">API Key:</span>
                    <span className="font-medium">
                      {analysisSettings.apiKey 
                        ? '********' + analysisSettings.apiKey.slice(-4)
                        : 'Not Configured'}
                    </span>
                  </li>
                </ul>
                {configError && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    Error: {configError}
                  </div>
                )}
                <p className="mt-3 text-xs text-gray-500">
                  API configuration is loaded from environment variables on the server.
                  Contact your administrator to change these settings.
                </p>
              </div>

              {/* Output Format */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Output Format
                </label>
                <select
                  value={analysisSettings.outputFormat}
                  onChange={(e) => setAnalysisSettings(prev => ({ ...prev, outputFormat: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="json">JSON</option>
                  <option value="markdown">Markdown</option>
                </select>
              </div>

              {/* Agent Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Analysis Agents
                </label>
                <div className="space-y-2">
                  {availableAgents.map(agent => (
                    <label key={agent.id} className="flex items-start space-x-3 p-3 border rounded-md hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={analysisSettings.agents.includes(agent.id)}
                        onChange={() => toggleAgent(agent.id)}
                        className="mt-0.5 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <p className="font-medium text-sm">{agent.label}</p>
                        <p className="text-xs text-gray-600">{agent.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - File Upload and Results */}
          <div className="lg:col-span-2">
            {/* File Upload Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Upload ABAP Files</h2>
              
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 text-center hover:bg-gray-50 transition-colors cursor-pointer file-upload-zone"
                onClick={() => fileInputRef.current.click()}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 font-medium mb-1">
                  Drag and drop ABAP files here
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  or click to browse files
                </p>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Select Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".abap,.ABAP"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-4">
                  Supported file types: .abap
                </p>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-between">
                    <span>Selected Files ({files.length})</span>
                    {files.length > 0 && (
                      <button
                        onClick={() => setFiles([])}
                        className="text-xs text-gray-500 hover:text-red-500"
                      >
                        Clear all
                      </button>
                    )}
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {files.map((file, index) => (
                      <div key={index} 
                           className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200 file-item">
                        <div className="flex items-center gap-3">
                          <File className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-gray-700 font-medium">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-gray-200"
                          aria-label="Remove file"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analysis Button */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={runAnalysis}
                  disabled={isAnalyzing || files.length === 0 || !analysisSettings.apiKey}
                  className={`flex items-center gap-2 px-6 py-3 rounded-md transition-all ${
                    isAnalyzing || files.length === 0 || !analysisSettings.apiKey
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md transform hover:-translate-y-0.5'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing Files...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Run ABAP Analysis
                    </>
                  )}
                </button>
              </div>

              {/* Requirements message */}
              {(files.length === 0 || !analysisSettings.apiKey) && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Before you can analyze:</h4>
                  <ul className="text-sm text-blue-700 space-y-1 ml-5 list-disc">
                    {files.length === 0 && (
                      <li>Upload at least one ABAP file</li>
                    )}
                    {!analysisSettings.apiKey && (
                      <li>API Key not configured in server environment variables</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            {/* Analysis Results */}
            {analysisResults && (
              <AnalysisResultsViewer analysisResults={analysisResults} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ABAPAnalyzer;
