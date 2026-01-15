import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area } from 'recharts';
import { MessageSquare, TrendingUp, BarChart3, Clock, AlertCircle, CheckCircle, XCircle, MinusCircle, Download, RefreshCw, Sparkles, Activity } from 'lucide-react';

function App() {
  const [review, setReview] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [bulkReviews, setBulkReviews] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("single");
  const [error, setError] = useState("");
  const [animateCharts, setAnimateCharts] = useState(false);

  const API_URL = "http://127.0.0.1:5000";

  useEffect(() => {
    if (result) {
      setAnimateCharts(true);
      setTimeout(() => setAnimateCharts(false), 1000);
    }
  }, [result]);

  const analyzeSentiment = async () => {
    if (!review.trim()) {
      setError("Please enter a review to analyze");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ review })
      });
      
      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      setResult(data);
      setHistory(prev => [data, ...prev].slice(0, 50));
      setLoading(false);
      setReview("");
    } catch (err) {
      setError("Failed to analyze sentiment. Make sure Flask backend is running on port 5000.");
      setLoading(false);
    }
  };

  const analyzeBulk = async () => {
    if (!bulkReviews.trim()) {
      setError("Please enter reviews to analyze");
      return;
    }

    setLoading(true);
    setError("");

    const reviewList = bulkReviews.split('\n').filter(r => r.trim());
    
    try {
      const response = await fetch(`${API_URL}/bulk-predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviews: reviewList })
      });
      
      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      
      const processedResults = data.results.map(result => ({
        ...result,
        positive: result.positive || 0.33,
        negative: result.negative || 0.33,
        neutral: result.neutral || 0.34
      }));
      
      setHistory(prev => [...processedResults, ...prev].slice(0, 50));
      setLoading(false);
      setBulkReviews("");
    } catch (err) {
      setError("Failed to analyze reviews. Make sure Flask backend is running.");
      setLoading(false);
    }
  };

  const pieData = result ? [
    { name: "Positive", value: result.positive, color: "#10b981" },
    { name: "Negative", value: result.negative, color: "#ef4444" },
    { name: "Neutral", value: result.neutral, color: "#f59e0b" },
  ] : [];

  const colors = ["#10b981", "#ef4444", "#f59e0b"];

  const getSentimentStats = () => {
    if (history.length === 0) return null;
    
    const stats = {
      positive: history.filter(h => h.label === 'Positive' || h.label === 'positive').length,
      negative: history.filter(h => h.label === 'Negative' || h.label === 'negative').length,
      neutral: history.filter(h => h.label === 'Neutral' || h.label === 'neutral').length,
    };

    return [
      { name: 'Positive', count: stats.positive, color: '#10b981' },
      { name: 'Negative', count: stats.negative, color: '#ef4444' },
      { name: 'Neutral', count: stats.neutral, color: '#f59e0b' },
    ];
  };

  const getTrendData = () => {
    if (history.length === 0) return [];
    
    const last10 = history.slice(0, 10).reverse();
    return last10.map((item, idx) => ({
      index: idx + 1,
      positive: (item.positive * 100).toFixed(0),
      negative: (item.negative * 100).toFixed(0),
      neutral: (item.neutral * 100).toFixed(0),
    }));
  };

  const getConfidenceDistribution = () => {
    if (history.length === 0) return [];
    
    const ranges = [
      { range: '0-20%', count: 0 },
      { range: '21-40%', count: 0 },
      { range: '41-60%', count: 0 },
      { range: '61-80%', count: 0 },
      { range: '81-100%', count: 0 },
    ];

    history.forEach(item => {
      const maxConf = Math.max(item.positive, item.negative, item.neutral) * 100;
      if (maxConf <= 20) ranges[0].count++;
      else if (maxConf <= 40) ranges[1].count++;
      else if (maxConf <= 60) ranges[2].count++;
      else if (maxConf <= 80) ranges[3].count++;
      else ranges[4].count++;
    });

    return ranges;
  };

  const getRadarData = () => {
    if (history.length === 0) return [];
    
    const avgPositive = history.reduce((sum, h) => sum + h.positive, 0) / history.length;
    const avgNegative = history.reduce((sum, h) => sum + h.negative, 0) / history.length;
    const avgNeutral = history.reduce((sum, h) => sum + h.neutral, 0) / history.length;

    return [
      { sentiment: 'Positive', value: (avgPositive * 100).toFixed(0) },
      { sentiment: 'Negative', value: (avgNegative * 100).toFixed(0) },
      { sentiment: 'Neutral', value: (avgNeutral * 100).toFixed(0) },
    ];
  };

  const getSentimentIcon = (label) => {
    const normalizedLabel = label?.toLowerCase();
    switch(normalizedLabel) {
      case 'positive': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'negative': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <MinusCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const downloadReport = () => {
    const report = {
      totalReviews: history.length,
      sentiment: getSentimentStats(),
      timestamp: new Date().toISOString(),
      reviews: history
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentiment-report-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Animated Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="relative">
              <MessageSquare className="w-12 h-12 text-cyan-400 animate-pulse" />
              <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-2 -right-2 animate-spin-slow" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Sentiment Analyzer
            </h1>
          </div>
          <p className="text-cyan-100 text-lg">Real-time Customer Review Analysis with Advanced ML</p>
          {history.length > 0 && (
            <div className="mt-4 flex gap-4 justify-center items-center text-sm text-cyan-200">
              <span className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                {history.length} Reviews Analyzed
              </span>
              <button
                onClick={downloadReport}
                className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 justify-center flex-wrap">
          {['single', 'bulk', 'insights', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 ${
                activeTab === tab 
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50" 
                  : "bg-white/10 text-cyan-100 hover:bg-white/20 backdrop-blur-sm"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Single Review Analysis */}
            {activeTab === "single" && (
              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
                  <h2 className="text-2xl font-semibold mb-4 text-cyan-100 flex items-center gap-2">
                    <Sparkles className="w-6 h-6" />
                    Analyze Customer Review
                  </h2>
                  
                  <textarea
                    placeholder="Enter customer review here... Try: 'This product is amazing! Fast delivery and great quality.'"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="w-full h-32 p-4 bg-white/5 border-2 border-cyan-500/30 text-white placeholder-cyan-300/50 rounded-xl focus:border-cyan-400 focus:outline-none resize-none backdrop-blur-sm"
                  />

                  {error && (
                    <div className="mt-3 p-3 bg-red-500/20 border border-red-400 rounded-xl flex items-center gap-2 backdrop-blur-sm">
                      <AlertCircle className="w-5 h-5 text-red-300" />
                      <span className="text-red-200">{error}</span>
                    </div>
                  )}

                  <button 
                    onClick={analyzeSentiment}
                    disabled={loading}
                    className="mt-4 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/30 transform hover:scale-105"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Analyzing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Analyze Sentiment
                      </span>
                    )}
                  </button>
                </div>

                {result && (
                  <div className="space-y-6 animate-slide-up">
                    {/* Result Header */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
                      <div className="p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl border-l-4 border-cyan-400 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-2">
                          {getSentimentIcon(result.label)}
                          <h3 className="text-2xl font-bold text-cyan-100">
                            Predicted: <span className={
                              result.label.toLowerCase() === 'positive' ? 'text-green-400' :
                              result.label.toLowerCase() === 'negative' ? 'text-red-400' : 'text-yellow-400'
                            }>{result.label}</span>
                          </h3>
                        </div>
                        <p className="text-cyan-200 text-sm ml-8">AI Confidence Analysis Below</p>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="p-5 bg-green-500/20 rounded-xl border border-green-400/30 backdrop-blur-sm transform hover:scale-110 transition-all">
                          <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
                          <div className="text-4xl font-bold text-green-400">{(result.positive * 100).toFixed(0)}%</div>
                          <div className="text-sm text-green-200 mt-1">Positive</div>
                          <div className="mt-2 h-2 bg-green-900/30 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-400 transition-all duration-1000"
                              style={{ width: `${result.positive * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="p-5 bg-red-500/20 rounded-xl border border-red-400/30 backdrop-blur-sm transform hover:scale-110 transition-all">
                          <XCircle className="w-8 h-8 text-red-400 mb-2" />
                          <div className="text-4xl font-bold text-red-400">{(result.negative * 100).toFixed(0)}%</div>
                          <div className="text-sm text-red-200 mt-1">Negative</div>
                          <div className="mt-2 h-2 bg-red-900/30 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-400 transition-all duration-1000"
                              style={{ width: `${result.negative * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="p-5 bg-yellow-500/20 rounded-xl border border-yellow-400/30 backdrop-blur-sm transform hover:scale-110 transition-all">
                          <MinusCircle className="w-8 h-8 text-yellow-400 mb-2" />
                          <div className="text-4xl font-bold text-yellow-400">{(result.neutral * 100).toFixed(0)}%</div>
                          <div className="text-sm text-yellow-200 mt-1">Neutral</div>
                          <div className="mt-2 h-2 bg-yellow-900/30 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-yellow-400 transition-all duration-1000"
                              style={{ width: `${result.neutral * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Visualizations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
                        <h4 className="text-cyan-200 mb-4 font-semibold flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Sentiment Distribution
                        </h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie 
                              data={pieData} 
                              dataKey="value" 
                              cx="50%" 
                              cy="50%" 
                              outerRadius={80}
                              innerRadius={40}
                              label={({ name, value }) => `${name}: ${(value * 100).toFixed(0)}%`}
                              animationBegin={0}
                              animationDuration={1000}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }}
                              formatter={(value) => `${(value * 100).toFixed(1)}%`} 
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
                        <h4 className="text-cyan-200 mb-4 font-semibold flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          Confidence Levels
                        </h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={pieData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                            <XAxis dataKey="name" stroke="#a5f3fc" />
                            <YAxis stroke="#a5f3fc" />
                            <Tooltip 
                              contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }}
                              formatter={(value) => `${(value * 100).toFixed(1)}%`} 
                            />
                            <Bar dataKey="value" radius={[10, 10, 0, 0]} animationDuration={1000}>
                              {pieData.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Additional Analysis */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
                      <h4 className="text-cyan-200 mb-4 font-semibold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Detailed Analysis
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="p-4 bg-cyan-500/10 rounded-xl border border-cyan-400/30">
                            <div className="text-sm text-cyan-200 mb-1">Overall Sentiment</div>
                            <div className="text-2xl font-bold text-cyan-100">{result.label}</div>
                          </div>
                          <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-400/30">
                            <div className="text-sm text-purple-200 mb-1">Confidence Score</div>
                            <div className="text-2xl font-bold text-purple-100">
                              {Math.max(result.positive, result.negative, result.neutral).toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-400/30">
                            <div className="text-sm text-blue-200 mb-1">Analysis Time</div>
                            <div className="text-lg font-semibold text-blue-100">{result.timestamp}</div>
                          </div>
                          <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-400/30">
                            <div className="text-sm text-indigo-200 mb-1">Model Used</div>
                            <div className="text-lg font-semibold text-indigo-100">TF-IDF + Naive Bayes</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Review Text Display */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
                      <h4 className="text-cyan-200 mb-3 font-semibold flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Analyzed Review
                      </h4>
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-cyan-100 italic">&quot;{result.review}&quot;</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bulk Analysis */}
            {activeTab === "bulk" && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
                <h2 className="text-2xl font-semibold mb-4 text-cyan-100 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6" />
                  Bulk Review Analysis
                </h2>
                
                <textarea
                  placeholder="Enter multiple reviews (one per line)...&#10;This product exceeded my expectations&#10;Terrible customer service&#10;Average quality for the price"
                  value={bulkReviews}
                  onChange={(e) => setBulkReviews(e.target.value)}
                  className="w-full h-64 p-4 bg-white/5 border-2 border-cyan-500/30 text-white placeholder-cyan-300/50 rounded-xl focus:border-cyan-400 focus:outline-none resize-none font-mono text-sm backdrop-blur-sm"
                />

                <button 
                  onClick={analyzeBulk}
                  disabled={loading}
                  className="mt-4 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-400 hover:to-pink-400 transition-all font-medium disabled:opacity-50 shadow-lg shadow-purple-500/30 transform hover:scale-105"
                >
                  {loading ? "Processing..." : "Analyze All Reviews"}
                </button>
              </div>
            )}

            {/* Insights Dashboard */}
            {activeTab === "insights" && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
                <h2 className="text-2xl font-semibold mb-6 text-cyan-100 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  Business Insights
                </h2>

                {history.length === 0 ? (
                  <div className="text-center py-12 text-cyan-200">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No data yet. Analyze some reviews to see insights!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-green-500/20 rounded-xl border border-green-400/30 backdrop-blur-sm">
                        <div className="text-4xl font-bold text-green-400">
                          {history.filter(h => (h.label?.toLowerCase() || '') === 'positive').length}
                        </div>
                        <div className="text-sm text-green-200">Positive Reviews</div>
                      </div>
                      <div className="p-4 bg-red-500/20 rounded-xl border border-red-400/30 backdrop-blur-sm">
                        <div className="text-4xl font-bold text-red-400">
                          {history.filter(h => (h.label?.toLowerCase() || '') === 'negative').length}
                        </div>
                        <div className="text-sm text-red-200">Negative Reviews</div>
                      </div>
                      <div className="p-4 bg-yellow-500/20 rounded-xl border border-yellow-400/30 backdrop-blur-sm">
                        <div className="text-4xl font-bold text-yellow-400">
                          {history.filter(h => (h.label?.toLowerCase() || '') === 'neutral').length}
                        </div>
                        <div className="text-sm text-yellow-200">Neutral Reviews</div>
                      </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                      <h4 className="text-cyan-200 mb-4 font-semibold">Sentiment Distribution</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={getSentimentStats()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                          <XAxis dataKey="name" stroke="#a5f3fc" />
                          <YAxis stroke="#a5f3fc" />
                          <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }} />
                          <Bar dataKey="count" radius={[8, 8, 0, 0]} animationDuration={800}>
                            {getSentimentStats().map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="p-4 bg-blue-500/20 rounded-xl border border-blue-400/30 backdrop-blur-sm">
                      <h3 className="font-semibold text-cyan-100 mb-2 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Key Recommendations
                      </h3>
                      <ul className="space-y-1 text-sm text-cyan-200">
                        <li>• Customer satisfaction: {((history.filter(h => (h.label?.toLowerCase() || '') === 'positive').length / history.length) * 100).toFixed(0)}%</li>
                        <li>• Total analyzed: {history.length}</li>
                        <li>• Focus: {history.filter(h => (h.label?.toLowerCase() || '') === 'negative').length > 0 ? 'Address negative feedback' : 'Maintain quality'}</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Advanced Analytics */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
                  <h2 className="text-2xl font-semibold mb-6 text-cyan-100 flex items-center gap-2">
                    <Activity className="w-6 h-6" />
                    Advanced Analytics
                  </h2>

                  {history.length === 0 ? (
                    <div className="text-center py-12 text-cyan-200">
                      <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Analyze reviews to see advanced analytics!</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                        <h4 className="text-cyan-200 mb-4 font-semibold">Sentiment Trend (Last 10 Reviews)</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={getTrendData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                            <XAxis dataKey="index" stroke="#a5f3fc" />
                            <YAxis stroke="#a5f3fc" />
                            <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }} />
                            <Legend />
                            <Line type="monotone" dataKey="positive" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                            <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
                            <Line type="monotone" dataKey="neutral" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                          <h4 className="text-cyan-200 mb-4 font-semibold">Confidence Distribution</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={getConfidenceDistribution()}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                              <XAxis dataKey="range" stroke="#a5f3fc" />
                              <YAxis stroke="#a5f3fc" />
                              <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }} />
                              <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                          <h4 className="text-cyan-200 mb-4 font-semibold">Average Sentiment Profile</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <RadarChart data={getRadarData()}>
                              <PolarGrid stroke="#ffffff30" />
                              <PolarAngleAxis dataKey="sentiment" stroke="#a5f3fc" />
                              <PolarRadiusAxis stroke="#a5f3fc" />
                              <Radar name="Average" dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
                              <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                        <h4 className="text-cyan-200 mb-4 font-semibold">Sentiment Flow (Area Chart)</h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={getTrendData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                            <XAxis dataKey="index" stroke="#a5f3fc" />
                            <YAxis stroke="#a5f3fc" />
                            <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }} />
                            <Area type="monotone" dataKey="positive" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                            <Area type="monotone" dataKey="neutral" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                            <Area type="monotone" dataKey="negative" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Recent History */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 sticky top-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-4 text-cyan-100 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Analysis
              </h3>
              
              {history.length === 0 ? (
                <p className="text-cyan-200 text-sm text-center py-8">No reviews analyzed yet</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {history.slice(0, 10).map((item, index) => (
                    <div key={index} className="p-3 bg-white/5 rounded-xl border border-white/10 hover:border-cyan-400/50 transition backdrop-blur-sm transform hover:scale-105">
                      <div className="flex items-start gap-2 mb-2">
                        {getSentimentIcon(item.label)}
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-cyan-100">{item.label}</div>
                          <div className="text-xs text-cyan-300">{item.timestamp}</div>
                        </div>
                      </div>
                      <p className="text-xs text-cyan-200 line-clamp-2">{item.review}</p>
                      <div className="mt-2 flex gap-2 text-xs">
                        <span className="text-green-400">+{(item.positive * 100).toFixed(0)}%</span>
                        <span className="text-red-400">-{(item.negative * 100).toFixed(0)}%</span>
                        <span className="text-yellow-400">~{(item.neutral * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-cyan-200">
          <p className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Powered by TF-IDF + Naive Bayes ML Model | Flask + React
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.8);
        }
      `}</style>
    </div>
  );
}

export default App;