'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import { Camera, Users, CheckCircle, AlertCircle, XCircle, Loader, UserPlus, Upload, Clock, BarChart3, Brain, Zap } from 'lucide-react'

interface RecognitionResult {
  status: string
  user?: string
  attendance?: string
  message?: string
  confidence?: number
}

interface ModelStatus {
  model_trained: boolean
  total_users: number
  training_in_progress: boolean
  last_trained?: string
  min_users_required: number
}

interface AttendanceRecord {
  username: string
  timestamp: string
  confidence: number
  date: string
}

interface User {
  username: string
  registered_date: string
}

interface DetailedUser {
  username: string
  display_name: string
  registered_date: string
  total_attendance_days: number
  total_attendance_records: number
  latest_attendance: string | null
  latest_attendance_time: string | null
  has_image: boolean
}

function UserRegistration({ onUserRegistered }: { onUserRegistered: () => void }) {
  const [username, setUsername] = useState('')
  const [isUsingWebcam, setIsUsingWebcam] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationResult, setRegistrationResult] = useState<{ status: string; message: string } | null>(null)
  const [isCaptureMode, setIsCaptureMode] = useState(false)
  
  const webcamRef = useRef<Webcam>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const capturePhoto = useCallback(() => {
    if (!webcamRef.current) return

    const imageSrc = webcamRef.current.getScreenshot()
    if (imageSrc) {
      // Convert base64 to blob
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `${username}_capture.jpg`, { type: 'image/jpeg' })
          setSelectedFile(file)
          setIsCaptureMode(false)
        })
    }
  }, [username])

  const registerUser = async () => {
    if (!username.trim() || !selectedFile) {
      setRegistrationResult({ status: 'error', message: 'Please enter username and capture/select an image' })
      return
    }

    setIsRegistering(true)
    setRegistrationResult(null)

    try {
      const formData = new FormData()
      formData.append('username', username.trim())
      formData.append('file', selectedFile)

      const response = await fetch('http://localhost:8000/register_user', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setRegistrationResult({ status: 'success', message: result.message })
        setUsername('')
        setSelectedFile(null)
        setIsCaptureMode(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        onUserRegistered()
      } else {
        setRegistrationResult({ status: 'error', message: result.detail || 'Registration failed' })
      }
    } catch (error) {
      setRegistrationResult({ status: 'error', message: 'Failed to connect to server' })
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-100">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
          <UserPlus className="text-white" size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Register New User</h2>
          <p className="text-gray-600 text-sm">Add a new person to the AI recognition system</p>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Username Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <Users className="inline mr-2" size={16} />
            Full Name
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg"
            placeholder="Enter full name (e.g., John Doe)"
            disabled={isRegistering}
          />
        </div>

        {/* Photo Input Method Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <Camera className="inline mr-2" size={16} />
            Choose Photo Method
          </label>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => {setIsUsingWebcam(true); setSelectedFile(null); setIsCaptureMode(false)}}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                isUsingWebcam 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg' 
                  : 'border-gray-300 bg-gray-50 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <Camera size={24} className="mx-auto mb-2" />
              <span className="text-sm font-medium block">Use Camera</span>
              <span className="text-xs text-gray-500">Live capture</span>
            </button>
            <button
              onClick={() => {setIsUsingWebcam(false); setIsCaptureMode(false)}}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                !isUsingWebcam 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg' 
                  : 'border-gray-300 bg-gray-50 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <Upload size={24} className="mx-auto mb-2" />
              <span className="text-sm font-medium block">Upload File</span>
              <span className="text-xs text-gray-500">From device</span>
            </button>
          </div>
        </div>

        {/* Photo Input */}
        {isUsingWebcam ? (
          <div className="space-y-4">
            {isCaptureMode ? (
              <div className="relative">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="w-full rounded-xl border-2 border-gray-300 shadow-lg"
                  videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
                />
                <div className="absolute inset-0 border-4 border-dashed border-blue-400 rounded-xl pointer-events-none opacity-60"></div>
                <div className="flex space-x-3 mt-4">
                  <button
                    onClick={capturePhoto}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center space-x-2 font-semibold shadow-lg"
                  >
                    <Camera size={20} />
                    <span>Capture Photo</span>
                  </button>
                  <button
                    onClick={() => setIsCaptureMode(false)}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCaptureMode(true)}
                disabled={isRegistering}
                className="w-full py-16 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <Camera size={64} className="mx-auto mb-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <p className="text-gray-700 font-semibold text-lg mb-2">Click to open camera</p>
                <p className="text-sm text-gray-500">Make sure your face is clearly visible and well-lit</p>
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
              disabled={isRegistering}
            />
          </div>
        )}

        {/* Photo Preview */}
        {selectedFile && (
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center space-x-3">
              <CheckCircle className="text-green-500" size={24} />
              <div>
                <p className="font-semibold text-green-800">Photo Ready!</p>
                <p className="text-sm text-green-700">{selectedFile.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Register Button */}
        <button
          onClick={registerUser}
          disabled={isRegistering || !username.trim() || !selectedFile}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-xl"
        >
          {isRegistering ? (
            <>
              <Loader className="animate-spin" size={24} />
              <span>Registering & Training AI...</span>
            </>
          ) : (
            <>
              <Brain size={24} />
              <span>Register & Train AI Model</span>
            </>
          )}
        </button>

        {/* Registration Result */}
        {registrationResult && (
          <div className={`p-6 rounded-xl border-l-4 ${
            registrationResult.status === 'success' 
              ? 'bg-green-50 border-green-400' 
              : 'bg-red-50 border-red-400'
          }`}>
            <div className="flex items-center space-x-3">
              {registrationResult.status === 'success' ? (
                <CheckCircle className="text-green-500" size={28} />
              ) : (
                <XCircle className="text-red-500" size={28} />
              )}
              <div>
                <p className={`font-semibold text-lg ${
                  registrationResult.status === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {registrationResult.message}
                </p>
                {registrationResult.status === 'success' && (
                  <div className="mt-2 flex items-center space-x-2 text-green-700">
                    <Zap size={16} />
                    <p className="text-sm font-medium">AI model is retraining automatically in the background</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FaceRecognition() {
  const [isCapturing, setIsCapturing] = useState(false)
  const [result, setResult] = useState<RecognitionResult | null>(null)
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null)
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([])
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  
  const webcamRef = useRef<Webcam>(null)

  const fetchModelStatus = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/model_status')
      const status = await response.json()
      setModelStatus(status)
    } catch (error) {
      console.error('Failed to fetch model status:', error)
    }
  }, [])

  const fetchTodayAttendance = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/attendance/today')
      const data = await response.json()
      setTodayAttendance(data.attendance || [])
    } catch (error) {
      console.error('Failed to fetch attendance:', error)
    }
  }, [])

  useEffect(() => {
    fetchModelStatus()
    fetchTodayAttendance()
    const interval = setInterval(() => {
      fetchModelStatus()
      fetchTodayAttendance()
    }, 3000)
    return () => clearInterval(interval)
  }, [fetchModelStatus, fetchTodayAttendance])

  const captureAndRecognize = useCallback(async () => {
    if (!webcamRef.current) return

    setIsCapturing(true)
    setResult(null)

    try {
      const imageSrc = webcamRef.current.getScreenshot()
      if (!imageSrc) {
        throw new Error('Failed to capture image')
      }

      const response = await fetch(imageSrc)
      const blob = await response.blob()

      const formData = new FormData()
      formData.append('file', blob, 'capture.jpg')

      const recognitionResponse = await fetch('http://localhost:8000/recognize_face', {
        method: 'POST',
        body: formData,
      })

      const recognitionResult = await recognitionResponse.json()
      setResult(recognitionResult)
      
      // Refresh data after recognition
      fetchModelStatus()
      fetchTodayAttendance()
    } catch (error) {
      setResult({ status: 'error', message: 'Failed to recognize face. Please try again.' })
    } finally {
      setIsCapturing(false)
    }
  }, [fetchModelStatus, fetchTodayAttendance])

  const removeAttendance = useCallback(async (username: string, date?: string) => {
    if (!confirm(`Are you sure you want to remove attendance for ${username.replace('_', ' ')}?`)) {
      return
    }

    setIsRemoving(username)

    try {
      const endpoint = date 
        ? `http://localhost:8000/attendance/${username}?date=${date}`
        : `http://localhost:8000/attendance/today/${username}`

      const response = await fetch(endpoint, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok && result.removed) {
        setResult({ 
          status: 'success', 
          message: `Attendance removed for ${username.replace('_', ' ')}` 
        })
        // Refresh attendance data
        fetchTodayAttendance()
      } else {
        setResult({ 
          status: 'error', 
          message: result.message || 'Failed to remove attendance' 
        })
      }
    } catch (error) {
      setResult({ 
        status: 'error', 
        message: 'Failed to connect to server' 
      })
    } finally {
      setIsRemoving(null)
      // Clear the result after 3 seconds
      setTimeout(() => setResult(null), 3000)
    }
  }, [fetchTodayAttendance])

  const clearAllTodayAttendance = useCallback(async () => {
    if (!confirm(`Are you sure you want to clear all attendance for today? This will remove ${todayAttendance.length} records.`)) {
      return
    }

    setIsRemoving('all')

    try {
      // Remove attendance for each user today
      const removePromises = todayAttendance.map(record => 
        fetch(`http://localhost:8000/attendance/today/${record.username}`, {
          method: 'DELETE',
        })
      )

      await Promise.all(removePromises)

      setResult({ 
        status: 'success', 
        message: `Cleared all ${todayAttendance.length} attendance records for today` 
      })
      
      // Refresh attendance data
      fetchTodayAttendance()
    } catch (error) {
      setResult({ 
        status: 'error', 
        message: 'Failed to clear attendance records' 
      })
    } finally {
      setIsRemoving(null)
      // Clear the result after 3 seconds
      setTimeout(() => setResult(null), 3000)
    }
  }, [todayAttendance, fetchTodayAttendance])

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
            <Camera className="text-white" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Face Recognition</h2>
            <p className="text-gray-600 text-sm">Position your face in the camera and capture</p>
          </div>
        </div>
        
        {modelStatus && (
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
              modelStatus.model_trained 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {modelStatus.model_trained ? '✓ Model Ready' : '⚠ Not Trained'}
            </div>
            {modelStatus.training_in_progress && (
              <div className="px-4 py-2 rounded-full text-sm bg-blue-100 text-blue-800 flex items-center space-x-2">
                <Loader className="animate-spin" size={16} />
                <span>Training AI</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2-Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Grid - Camera & Recognition */}
        <div className="bg-white rounded-xl shadow-2xl p-6 border border-gray-100">
          <div className="space-y-6">
            <div className="relative">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full rounded-xl shadow-lg border-2 border-gray-200"
                videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
              />
              <div className="absolute inset-0 border-4 border-dashed border-green-400 rounded-xl pointer-events-none opacity-40"></div>
            </div>
            
            <button
              onClick={captureAndRecognize}
              disabled={isCapturing || !modelStatus?.model_trained}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-xl"
            >
              {isCapturing ? (
                <>
                  <Loader className="animate-spin" size={24} />
                  <span>Recognizing...</span>
                </>
              ) : (
                <>
                  <Camera size={24} />
                  <span>Mark Attendance</span>
                </>
              )}
            </button>

            {!modelStatus?.model_trained && (
              <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="text-yellow-600" size={20} />
                  <div>
                    <p className="font-semibold text-yellow-800 text-sm">AI Model Not Ready</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Register at least {modelStatus?.min_users_required || 2} users to train AI
                    </p>
                  </div>
                </div>
              </div>
            )}

            {result && (
              <div className={`p-4 rounded-xl border-2 ${
                result.status === 'success' ? 'bg-green-50 border-green-300' :
                result.status === 'already_marked' ? 'bg-yellow-50 border-yellow-300' :
                result.status === 'unknown' ? 'bg-orange-50 border-orange-300' :
                'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {result.status === 'success' && <CheckCircle className="text-green-600" size={24} />}
                    {result.status === 'unknown' && <AlertCircle className="text-orange-600" size={24} />}
                    {result.status === 'error' && <XCircle className="text-red-600" size={24} />}
                    {result.status === 'already_marked' && <Clock className="text-yellow-600" size={24} />}
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold ${
                      result.status === 'success' ? 'text-green-800' :
                      result.status === 'already_marked' ? 'text-yellow-800' :
                      result.status === 'unknown' ? 'text-orange-800' :
                      'text-red-800'
                    }`}>
                      {result.message}
                    </p>
                    {result.user && (
                      <p className="text-sm opacity-75 mt-1">User: {result.user}</p>
                    )}
                    {result.confidence && (
                      <p className="text-sm opacity-75 mt-1">
                        Confidence: {(result.confidence * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Grid - Today's Attendance Summary */}
        <div className="bg-white rounded-xl shadow-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="text-blue-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Today's Attendance</h3>
            </div>
            {todayAttendance.length > 0 && (
              <button
                onClick={() => clearAllTodayAttendance()}
                disabled={isRemoving === 'all'}
                className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                title="Clear all today's attendance"
              >
                {isRemoving === 'all' ? (
                  <>
                    <Loader className="animate-spin" size={14} />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <>
                    <XCircle size={14} />
                    <span>Clear All</span>
                  </>
                )}
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {todayAttendance.length > 0 ? (
              <div className="space-y-3">
                {todayAttendance.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-green-500" size={20} />
                      <div>
                        <span className="font-medium capitalize block">{record.username.replace('_', ' ')}</span>
                        <span className="text-xs text-gray-500">{(record.confidence * 100).toFixed(1)}% confidence</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-sm text-gray-600 text-right">
                        <div>{new Date(record.timestamp).toLocaleTimeString()}</div>
                        <div className="text-xs text-gray-400">{record.date}</div>
                      </div>
                      <button
                        onClick={() => removeAttendance(record.username, record.date)}
                        disabled={isRemoving === record.username}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove attendance"
                      >
                        {isRemoving === record.username ? (
                          <Loader className="animate-spin" size={16} />
                        ) : (
                          <XCircle size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500 font-medium">No attendance marked today</p>
                <p className="text-gray-400 text-sm mt-1">Start recognizing faces to see attendance records</p>
              </div>
            )}
          </div>
          
          {/* Quick Stats */}
          {modelStatus?.total_users > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">{todayAttendance.length}</div>
                  <div className="text-xs text-blue-800">Present Today</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-600">{modelStatus.total_users}</div>
                  <div className="text-xs text-purple-800">Total Users</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function UserManagement() {
  const [users, setUsers] = useState<DetailedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null)
  const [deleteResult, setDeleteResult] = useState<{ status: string; message: string } | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/users/detailed')
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const deleteUser = useCallback(async (username: string) => {
    if (!confirm(`Are you sure you want to delete ${username.replace('_', ' ').toUpperCase()}?\n\nThis will:\n• Remove the user from the system\n• Delete all their attendance records\n• Remove their face data\n• Retrain the AI model\n\nThis action cannot be undone!`)) {
      return
    }

    setIsDeletingUser(username)
    setDeleteResult(null)

    try {
      const response = await fetch(`http://localhost:8000/user/${username}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        setDeleteResult({ 
          status: 'success', 
          message: result.message 
        })
        // Refresh users list
        fetchUsers()
      } else {
        setDeleteResult({ 
          status: 'error', 
          message: result.detail || 'Failed to delete user' 
        })
      }
    } catch (error) {
      setDeleteResult({ 
        status: 'error', 
        message: 'Failed to connect to server' 
      })
    } finally {
      setIsDeletingUser(null)
      // Clear result after 5 seconds
      setTimeout(() => setDeleteResult(null), 5000)
    }
  }, [fetchUsers])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
            <Users className="text-white" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
            <p className="text-gray-600 text-sm">Manage registered users and their data</p>
          </div>
        </div>
      </div>

      {/* Delete Result */}
      {deleteResult && (
        <div className={`p-4 rounded-xl border-l-4 ${
          deleteResult.status === 'success' 
            ? 'bg-green-50 border-green-400' 
            : 'bg-red-50 border-red-400'
        }`}>
          <div className="flex items-center space-x-3">
            {deleteResult.status === 'success' ? (
              <CheckCircle className="text-green-500" size={24} />
            ) : (
              <XCircle className="text-red-500" size={24} />
            )}
            <p className={`font-semibold ${
              deleteResult.status === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {deleteResult.message}
            </p>
          </div>
        </div>
      )}

      {/* Users Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader className="mx-auto animate-spin text-purple-500 mb-4" size={48} />
          <p className="text-gray-500 font-medium">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto text-gray-300 mb-4" size={64} />
          <p className="text-gray-500 font-medium text-lg">No users registered yet</p>
          <p className="text-gray-400 text-sm mt-1">Switch to Register User tab to add users</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div key={user.username} className="bg-white rounded-xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-200">
              {/* User Avatar */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {user.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800">{user.display_name}</h3>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                  {user.has_image && (
                    <div className="flex items-center space-x-1 mt-1">
                      <CheckCircle className="text-green-500" size={12} />
                      <span className="text-xs text-green-600">Image Available</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-blue-600">{user.total_attendance_days}</div>
                  <div className="text-xs text-blue-800">Days Present</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-green-600">{user.total_attendance_records}</div>
                  <div className="text-xs text-green-800">Total Records</div>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Registered:</span>
                  <span className="font-medium">{new Date(user.registered_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Attendance:</span>
                  <span className="font-medium">
                    {user.latest_attendance 
                      ? new Date(user.latest_attendance).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => deleteUser(user.username)}
                  disabled={isDeletingUser === user.username}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isDeletingUser === user.username ? (
                    <>
                      <Loader className="animate-spin" size={16} />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} />
                      <span>Delete User</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {users.length > 0 && (
        <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Summary Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{users.length}</div>
              <div className="text-sm text-purple-800">Total Users</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {users.reduce((sum, user) => sum + user.total_attendance_days, 0)}
              </div>
              <div className="text-sm text-blue-800">Total Attendance Days</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {users.reduce((sum, user) => sum + user.total_attendance_records, 0)}
              </div>
              <div className="text-sm text-green-800">Total Records</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {users.filter(user => user.has_image).length}
              </div>
              <div className="text-sm text-orange-800">With Images</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'recognize' | 'register' | 'users'>('register')
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null)

  const fetchModelStatus = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/model_status')
      const status = await response.json()
      setModelStatus(status)
      
      // Auto-switch to recognition tab if model is ready and we're on register tab
      if (status.model_trained && activeTab === 'register' && status.total_users >= 2) {
        setTimeout(() => setActiveTab('recognize'), 1000)
      }
    } catch (error) {
      console.error('Failed to fetch model status:', error)
    }
  }, [activeTab])

  useEffect(() => {
    fetchModelStatus()
    const interval = setInterval(fetchModelStatus, 3000)
    return () => clearInterval(interval)
  }, [fetchModelStatus])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Brain className="text-white" size={36} />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Attend-II
            </h1>
          </div>
          <p className="text-xl text-gray-600 font-medium">AI-Powered Face Recognition Attendance System</p>
          
          {/* Status Dashboard */}
          {modelStatus && (
            <div className="mt-6 flex justify-center">
              <div className="bg-white rounded-2xl shadow-xl p-4 border border-gray-200">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Users size={20} className="text-blue-500" />
                    <span className="font-semibold text-gray-700">
                      {modelStatus.total_users} Users
                    </span>
                  </div>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                    modelStatus.model_trained 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      modelStatus.model_trained ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-semibold">
                      {modelStatus.model_trained ? 'AI Ready' : 'AI Not Trained'}
                    </span>
                  </div>
                  {modelStatus.training_in_progress && (
                    <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                      <Loader className="animate-spin" size={16} />
                      <span className="text-sm font-semibold">Training</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-2 border border-gray-200">
            <button
              onClick={() => setActiveTab('register')}
              className={`px-6 py-3 rounded-xl transition-all duration-200 font-semibold ${
                activeTab === 'register' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <UserPlus size={18} />
                <span>Register User</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('recognize')}
              className={`px-6 py-3 rounded-xl transition-all duration-200 font-semibold ${
                activeTab === 'recognize' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Camera size={18} />
                <span>Mark Attendance</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 rounded-xl transition-all duration-200 font-semibold ${
                activeTab === 'users' 
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users size={18} />
                <span>Manage Users</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {activeTab === 'register' && (
            <UserRegistration onUserRegistered={fetchModelStatus} />
          )}
          {activeTab === 'recognize' && (
            <FaceRecognition />
          )}
          {activeTab === 'users' && (
            <UserManagement />
          )}
        </div>
      </div>
    </div>
  )
}