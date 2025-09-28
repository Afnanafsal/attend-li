'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import { Camera, Users, CheckCircle, AlertCircle, XCircle, Loader, UserPlus, Upload, Clock, BarChart3, Brain, Zap, User, Mail, Building, Crown, ArrowRight, ArrowLeft, Trash2, AlertTriangle } from 'lucide-react'

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
  const [currentStep, setCurrentStep] = useState(1)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [role, setRole] = useState('')
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

  const nextStep = () => {
    if (username.trim()) {
      setCurrentStep(2)
    }
  }

  const prevStep = () => {
    setCurrentStep(1)
  }

  const registerUser = async () => {
    if (!username.trim() || !selectedFile) {
      setRegistrationResult({ status: 'error', message: 'Please complete all required fields' })
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
        setEmail('')
        setDepartment('')
        setRole('')
        setSelectedFile(null)
        setIsCaptureMode(false)
        setCurrentStep(1)
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
    <div className="max-w-2xl mx-auto">
      {/* Step Progress */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            1
          </div>
          <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            2
          </div>
        </div>
      </div>

      {currentStep === 1 ? (
        /* Step 1: College Information */
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-3 bg-blue-100 text-blue-700 px-6 py-3 rounded-2xl font-semibold">
              <span>College Registration</span>
            </div>
          </div>

          <div className="space-y-6">
            {/* Name Field */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">
                Full Name *
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-4 bg-white/90 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all text-lg"
                placeholder="Enter your full name..."
                disabled={isRegistering}
              />
            </div>

            {/* Email Field */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-4 bg-white/90 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all text-lg"
                placeholder="Enter your email address..."
                disabled={isRegistering}
              />
            </div>

            {/* Department and Role in same line */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Department Field */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">
                  Department *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-4 bg-white/90 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400 transition-all text-lg"
                  disabled={isRegistering}
                >
                  <option value="">Select Department</option>
                  <option value="CSE">Computer Science & Engineering</option>
                  <option value="MECH">Mechanical Engineering</option>
                  <option value="AI">Artificial Intelligence</option>
                  <option value="CYBER">Cyber Security</option>
                  <option value="ECE">Electronics & Communication</option>
                  <option value="FOOD_TECH">Food & Technology</option>
                  <option value="AGRICULTURE">Agriculture</option>
                  <option value="EEE">Electrical & Electronics</option>
                  <option value="CIVIL">Civil Engineering</option>
                </select>
              </div>

              {/* Role Field */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">
                  Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-4 bg-white/90 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all text-lg"
                  disabled={isRegistering}
                >
                  <option value="">Select Role</option>
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty</option>
                </select>
              </div>
            </div>
          </div>

          {/* Next Step Button */}
          <div className="mt-8 text-center">
            <button
              onClick={nextStep}
              disabled={!username.trim() || !email.trim() || !department.trim() || !role.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 font-semibold text-lg transition-all duration-300 transform hover:scale-105 mx-auto"
            >
              <span>Continue</span>
            </button>
          </div>
        </div>
      ) : (
        /* Step 2: Photo Capture */
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <button
              onClick={prevStep}
              className="float-left text-blue-500 hover:text-blue-600 flex items-center space-x-2"
            >
              <span>← Back</span>
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Add Your Photo</h2>
            <p className="text-gray-600">Choose how to add your photo</p>
          </div>

          <div className="space-y-6">
            {/* Photo Method Selection */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {setIsUsingWebcam(true); setSelectedFile(null); setIsCaptureMode(false)}}
                className={`p-6 rounded-xl border-2 transition-all ${
                  isUsingWebcam 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <Camera size={32} className="mx-auto mb-2 text-blue-500" />
                <span className="block font-medium">Camera</span>
              </button>
              
              <button
                onClick={() => {setIsUsingWebcam(false); setIsCaptureMode(false)}}
                className={`p-6 rounded-xl border-2 transition-all ${
                  !isUsingWebcam 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <Upload size={32} className="mx-auto mb-2 text-blue-500" />
                <span className="block font-medium">Upload</span>
              </button>
            </div>

            {/* Photo Interface */}
            {isUsingWebcam ? (
              <div className="space-y-4">
                {isCaptureMode ? (
                  <div>
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      className="w-full rounded-xl border-2 border-gray-300"
                      videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
                    />
                    <div className="flex space-x-3 mt-4">
                      <button
                        onClick={capturePhoto}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-xl font-medium"
                      >
                        Capture
                      </button>
                      <button
                        onClick={() => setIsCaptureMode(false)}
                        className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCaptureMode(true)}
                    className="w-full py-12 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50"
                  >
                    <Camera size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 font-medium">Open Camera</p>
                  </button>
                )}
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700"
                />
              </div>
            )}

            {selectedFile && (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-500" size={20} />
                  <span className="text-green-700 font-medium">Photo ready: {selectedFile.name}</span>
                </div>
              </div>
            )}

            <button
              onClick={registerUser}
              disabled={isRegistering || !selectedFile}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-xl font-medium flex items-center justify-center space-x-2"
            >
              {isRegistering ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Complete Registration</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Registration Result */}
      {registrationResult && (
        <div className={`mt-6 p-4 rounded-xl ${
          registrationResult.status === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-3">
            {registrationResult.status === 'success' ? (
              <CheckCircle className="text-green-500" size={20} />
            ) : (
              <XCircle className="text-red-500" size={20} />
            )}
            <span className={`font-medium ${
              registrationResult.status === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {registrationResult.message}
            </span>
          </div>
        </div>
      )}


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
  const [selectedUser, setSelectedUser] = useState<DetailedUser | null>(null)
  const [userDetails, setUserDetails] = useState<any | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

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

  const fetchUserDetails = useCallback(async (username: string) => {
    setIsLoadingDetails(true)
    try {
      const response = await fetch(`http://localhost:8000/user/${username}`)
      const data = await response.json()
      if (response.ok) {
        setUserDetails(data)
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error)
    } finally {
      setIsLoadingDetails(false)
    }
  }, [])

  const selectUser = useCallback((user: DetailedUser) => {
    setSelectedUser(user)
    fetchUserDetails(user.username)
  }, [fetchUserDetails])

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
            <p className="text-gray-600 text-sm">
              {selectedUser ? `Viewing details for ${selectedUser.display_name}` : 'Manage registered users and their data'}
            </p>
          </div>
        </div>
        {selectedUser && (
          <button
            onClick={() => {
              setSelectedUser(null)
              setUserDetails(null)
            }}
            className="mt-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors flex items-center space-x-2 mx-auto"
          >
            <ArrowLeft size={16} />
            <span>Back to User List</span>
          </button>
        )}
      </div>

      {/* Two-Grid Layout */}
      <div className={`grid gap-6 ${selectedUser ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* Left Grid - Users List or Selected User Details */}
        <div>
          {selectedUser ? (
            /* Selected User Details */
            <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-3xl">
                    {selectedUser.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{selectedUser.display_name}</h3>
                <p className="text-gray-500">@{selectedUser.username}</p>
                {selectedUser.has_image && (
                  <div className="flex items-center justify-center space-x-2 mt-2">
                    <CheckCircle className="text-green-500" size={16} />
                    <span className="text-sm text-green-600">Profile Image Available</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">{selectedUser.total_attendance_days}</div>
                    <div className="text-sm text-blue-800">Days Present</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">{selectedUser.total_attendance_records}</div>
                    <div className="text-sm text-green-800">Total Records</div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Registered:</span>
                    <span className="font-semibold">{new Date(selectedUser.registered_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Last Attendance:</span>
                    <span className="font-semibold">
                      {selectedUser.latest_attendance 
                        ? new Date(selectedUser.latest_attendance).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteUser(selectedUser.username)}
                  disabled={isDeletingUser === selectedUser.username}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold"
                >
                  {isDeletingUser === selectedUser.username ? (
                    <>
                      <Loader className="animate-spin" size={16} />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>Delete User</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Users List */
            <div>
              {/* Delete Result */}
              {deleteResult && (
                <div className={`p-4 rounded-xl border-l-4 mb-6 ${
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
                    <div 
                      key={user.username} 
                      onClick={() => selectUser(user)}
                      className="bg-white rounded-xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-200 cursor-pointer hover:border-purple-300"
                    >
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

                      <div className="pt-2 border-t border-gray-100 text-center">
                        <span className="text-xs text-purple-600 font-medium">Click to view details</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Grid - Detailed Information (when user selected) */}
        {selectedUser && (
          <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Detailed Information</h3>
              <p className="text-gray-600 text-sm">Complete profile and attendance history</p>
            </div>

            {isLoadingDetails ? (
              <div className="text-center py-12">
                <Loader className="mx-auto animate-spin text-purple-500 mb-4" size={48} />
                <p className="text-gray-500 font-medium">Loading details...</p>
              </div>
            ) : userDetails ? (
              <div className="space-y-6">
                {/* Attendance Records */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                    <Clock size={20} className="text-blue-500" />
                    <span>Recent Attendance</span>
                  </h4>
                  {userDetails.attendance_records && userDetails.attendance_records.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {userDetails.attendance_records.map((record: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold text-gray-800">
                                {new Date(record.date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-sm text-gray-600">
                                {new Date(record.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-green-600">
                                {(record.confidence * 100).toFixed(1)}% confidence
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock size={48} className="mx-auto mb-3 text-gray-300" />
                      <p>No attendance records yet</p>
                    </div>
                  )}
                </div>

                {/* Additional Stats */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                    <BarChart3 size={20} className="text-green-500" />
                    <span>Statistics</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{userDetails.total_attendance_days}</div>
                      <div className="text-sm text-blue-800">Unique Days Present</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{userDetails.total_attendance_records}</div>
                      <div className="text-sm text-green-800">Total Check-ins</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {userDetails.has_image ? 'Yes' : 'No'}
                      </div>
                      <div className="text-sm text-orange-800">Profile Image</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <AlertTriangle size={48} className="mx-auto mb-3 text-gray-300" />
                <p>Failed to load user details</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats - Only show when not viewing individual user */}
      {!selectedUser && users.length > 0 && (
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 relative overflow-hidden">
      {/* Creative Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        {/* Organic Shapes */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-200/20 to-pink-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-1000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-gradient-to-tr from-cyan-200/20 to-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Compact Header */}
        <div className="relative mb-6">
          {/* Main Header Content */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            {/* Left: Logo & Title */}
            <div className="flex items-center">
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                  <Brain className="text-white" size={24} />
                </div>
              </div>
              
              <div className="ml-4">
                <h1 className="text-2xl font-bold tracking-tight">
                  <span className="text-slate-900">College</span>
                  <span className="text-blue-600"> Attendance</span>
                </h1>
                <p className="text-xs text-slate-600 font-medium">AI-Powered System</p>
              </div>
            </div>

            {/* Right: Status Cards */}
            {modelStatus && (
              <div className="flex gap-3">
                {/* Users Count */}
                <div className="bg-white/90 rounded-xl shadow-md px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <Users size={16} className="text-blue-500" />
                    <div>
                      <div className="text-lg font-bold text-slate-800">{modelStatus.total_users}</div>
                      <div className="text-xs text-slate-500">Users</div>
                    </div>
                  </div>
                </div>

                {/* AI Status */}
                <div className={`bg-white/90 rounded-xl shadow-md px-4 py-2 ${
                  modelStatus.model_trained ? 'ring-1 ring-green-200' : 'ring-1 ring-amber-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    {modelStatus.training_in_progress ? (
                      <Loader className="text-blue-500 animate-spin" size={16} />
                    ) : (
                      <Brain className={modelStatus.model_trained ? 'text-green-500' : 'text-amber-500'} size={16} />
                    )}
                    <div>
                      <div className={`text-sm font-bold ${
                        modelStatus.model_trained ? 'text-green-700' : 'text-amber-700'
                      }`}>
                        {modelStatus.training_in_progress ? 'Training' : 
                         modelStatus.model_trained ? 'Ready' : 'Setup'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compact Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-xl shadow-lg p-1 inline-flex space-x-1">
            <button
              onClick={() => setActiveTab('register')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === 'register' 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <UserPlus size={16} />
                <span className="font-medium">Register</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('recognize')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === 'recognize' 
                  ? 'bg-green-500 text-white shadow-md' 
                  : 'text-slate-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Camera size={16} />
                <span className="font-medium">Attendance</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === 'users' 
                  ? 'bg-purple-500 text-white shadow-md' 
                  : 'text-slate-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users size={16} />
                <span className="font-medium">Users</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content with Enhanced Animations */}
        <div className="relative">
          {/* Content Background */}
          <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-3xl -m-6 shadow-2xl border border-white/40"></div>
          
          {/* Actual Content */}
          <div className="relative z-10 p-6">
            <div className="transition-all duration-500 ease-in-out transform">
              {activeTab === 'register' && (
                <div className="animate-in slide-in-from-right-5 duration-300">
                  <UserRegistration onUserRegistered={fetchModelStatus} />
                </div>
              )}
              {activeTab === 'recognize' && (
                <div className="animate-in slide-in-from-bottom-5 duration-300">
                  <FaceRecognition />
                </div>
              )}
              {activeTab === 'users' && (
                <div className="animate-in slide-in-from-left-5 duration-300">
                  <UserManagement />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}