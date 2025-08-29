import React from 'react';
import Footer from '../common/Footer';

const Stat = ({ value, label }) => (
  <div className="text-center">
    <div className="text-3xl font-extrabold text-blue-700">{value}</div>
    <div className="text-sm text-gray-600 mt-1">{label}</div>
  </div>
);

const Badge = ({ title, description }) => (
  <div className="p-5 rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
    <div className="flex items-start gap-3">
      <span className="text-2xl">✅</span>
      <div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

const LandingPage = ({ onSignIn }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-gradient-to-r from-blue-500 to-blue-700 shadow-lg border-b border-blue-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3 group">
            {/* Enhanced Frog Logo */}
            <div className="relative">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 animate-breathe">
                <span className="text-2xl filter drop-shadow-sm">🐸</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-xs">✨</span>
              </div>
            </div>
            
            {/* Logo Text */}
            <div className="flex flex-col">
              <div className="flex items-center space-x-1">
                <h1 className="text-xl font-black text-white tracking-tight">LeapFrog</h1>
                <span className="px-2 py-0.5 bg-yellow-400 text-blue-800 text-xs font-bold rounded-full uppercase tracking-wide shadow-sm animate-pulse-glow">
                  AI
                </span>
              </div>
              <span className="text-xs text-blue-100 font-medium hidden sm:block -mt-0.5">
                🏥 Healthcare Platform
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white">
            <a href="#about" className="hover:text-yellow-200 transition-colors">About</a>
            <a href="#leapfrog" className="hover:text-yellow-200 transition-colors">Leapfrog Methodology</a>
            <a href="#services" className="hover:text-yellow-200 transition-colors">Services</a>
            <a href="#outcomes" className="hover:text-yellow-200 transition-colors">Outcomes</a>
            <a href="#contact" className="hover:text-yellow-200 transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onSignIn}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/30 transition-all duration-200 hover:scale-105 border border-white/30"
            >
              <span>Sign in</span>
            </button>
          </div>
        </div>
      </nav>
        {/* Hero */}
  <section className="relative overflow-hidden bg-gradient-to-br from-blue-100 via-blue-50 to-white">
    {/* Background Video */}
    <div className="absolute inset-0 z-0">
      <video 
        autoPlay 
        muted 
        loop 
        className="w-full h-full object-cover opacity-90"
        poster="/assets/images/hero.svg"
      >
        <source src="/assets/videos/video2.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/80 to-white/90"></div>
    </div>
    
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="text-left">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-800 text-sm font-semibold mb-6">
            🚀 AI-Powered Healthcare Platform
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-blue-900 leading-tight">
            Welcome to 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800"> LeapFrog</span>
            <span className="block text-4xl lg:text-5xl mt-2">Health Platform</span>
          </h1>
          <p className="mt-6 text-xl text-blue-700 leading-relaxed">
            Revolutionary AI-driven healthcare insights and predictive analytics for personalized patient care. 
            Experience the future of medical data analysis.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={onSignIn}
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              🏥 Start Your Journey
            </button>
            <a
              href="#features"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-700 text-lg font-semibold rounded-xl border-2 border-blue-200 hover:bg-blue-50 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              📊 Explore Features
            </a>
          </div>
          
          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-900">50K+</div>
              <div className="text-sm text-blue-600 font-medium">Patients Served</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-900">98%</div>
              <div className="text-sm text-blue-600 font-medium">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-900">24/7</div>
              <div className="text-sm text-blue-600 font-medium">AI Monitoring</div>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <img 
            src="/assets/images/img.png" 
            alt="Healthcare Dashboard Preview" 
            className="w-full h-auto rounded-2xl shadow-2xl border-4 border-white"
          />
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-xl">
            <span className="text-4xl">🤖</span>
          </div>
        </div>
      </div>
    </div>
  </section>
        {/* Features */}
  <section id="features" className="py-20 bg-gradient-to-b from-white to-blue-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-800 text-sm font-semibold mb-4">
          ✨ Platform Features
        </div>
        <h2 className="text-4xl font-extrabold text-blue-900 mb-4">
          Revolutionizing Healthcare with AI
        </h2>
        <p className="text-xl text-blue-700 max-w-3xl mx-auto">
          Discover how our advanced AI technology transforms patient care and medical decision-making
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <span className="text-2xl">🧠</span>
          </div>
          <h3 className="text-xl font-bold text-blue-900 mb-3">AI-Driven Insights</h3>
          <p className="text-blue-700 leading-relaxed">
            Leverage cutting-edge artificial intelligence to gain deep insights into patient health patterns, 
            treatment outcomes, and predictive health indicators.
          </p>
          <div className="mt-4 inline-flex items-center text-blue-600 font-semibold text-sm">
            Learn More →
          </div>
        </div>
        
        <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-xl font-bold text-blue-900 mb-3">Predictive Analytics</h3>
          <p className="text-blue-700 leading-relaxed">
            Predict patient outcomes and optimize treatment plans with advanced machine learning models 
            that analyze vast amounts of medical data.
          </p>
          <div className="mt-4 inline-flex items-center text-blue-600 font-semibold text-sm">
            Learn More →
          </div>
        </div>
        
        <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <span className="text-2xl">🎯</span>
          </div>
          <h3 className="text-xl font-bold text-blue-900 mb-3">Personalized Care</h3>
          <p className="text-blue-700 leading-relaxed">
            Deliver personalized healthcare experiences tailored to individual patient needs, 
            preferences, and medical history for optimal outcomes.
          </p>
          <div className="mt-4 inline-flex items-center text-blue-600 font-semibold text-sm">
            Learn More →
          </div>
        </div>
        
        <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <span className="text-2xl">⚡</span>
          </div>
          <h3 className="text-xl font-bold text-blue-900 mb-3">Real-time Monitoring</h3>
          <p className="text-blue-700 leading-relaxed">
            Monitor patient vitals and health metrics in real-time with intelligent alerts 
            and automated risk assessment protocols.
          </p>
          <div className="mt-4 inline-flex items-center text-blue-600 font-semibold text-sm">
            Learn More →
          </div>
        </div>
        
        <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <span className="text-2xl">🔒</span>
          </div>
          <h3 className="text-xl font-bold text-blue-900 mb-3">Secure & Compliant</h3>
          <p className="text-blue-700 leading-relaxed">
            HIPAA-compliant platform with enterprise-grade security measures, 
            ensuring complete privacy and protection of sensitive medical data.
          </p>
          <div className="mt-4 inline-flex items-center text-blue-600 font-semibold text-sm">
            Learn More →
          </div>
        </div>
        
        <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <span className="text-2xl">🌐</span>
          </div>
          <h3 className="text-xl font-bold text-blue-900 mb-3">Cloud Integration</h3>
          <p className="text-blue-700 leading-relaxed">
            Seamlessly integrate with existing healthcare systems and cloud infrastructure 
            for scalable, efficient data management and analysis.
          </p>
          <div className="mt-4 inline-flex items-center text-blue-600 font-semibold text-sm">
            Learn More →
          </div>
        </div>
      </div>
    </div>
  </section>
  
  {/* About Section with Image */}
  <section id="about" className="py-20 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-800 text-sm font-semibold mb-6">
            🏥 About LeapFrog
          </div>
          <h2 className="text-4xl font-extrabold text-blue-900 mb-6">
            Transforming Healthcare Through Innovation
          </h2>
          <p className="text-lg text-blue-700 mb-6 leading-relaxed">
            LeapFrog Health represents the next generation of healthcare technology, combining 
            artificial intelligence, machine learning, and predictive analytics to revolutionize 
            patient care and medical decision-making.
          </p>
          <p className="text-lg text-blue-700 mb-8 leading-relaxed">
            Our platform empowers healthcare professionals with intelligent insights, 
            enables personalized treatment plans, and improves patient outcomes through 
            data-driven medicine.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onSignIn}
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg"
            >
              Get Started Today
            </button>
            <a
              href="#contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-700 font-semibold rounded-xl border-2 border-blue-200 hover:bg-blue-50 transition-all duration-300"
            >
              Contact Us
            </a>
          </div>
        </div>
        <div className="relative">
          <img 
            src="/assets/images/img2.png" 
            alt="Healthcare Innovation" 
            className="w-full h-auto rounded-2xl shadow-2xl"
          />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-blue-900/20 to-transparent"></div>
        </div>
      </div>
    </div>
  </section>
  
  {/* Outcomes Video Section */}
  <section id="outcomes" className="py-20 bg-gradient-to-b from-blue-50 to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-800 text-sm font-semibold mb-6">
          📈 Proven Outcomes
        </div>
        <h2 className="text-4xl font-extrabold text-blue-900 mb-4">
          See Our Impact in Action
        </h2>
        <p className="text-xl text-blue-700 max-w-3xl mx-auto">
          Watch how LeapFrog Health is transforming patient care and improving medical outcomes
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Video Container - Left Side */}
        <div className="order-2 lg:order-1">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-blue-900 max-w-xl mx-auto lg:mx-0" style={{minHeight: '255px'}}>
            <video 
              controls 
              className="w-full h-full object-cover"
              poster="/assets/images/hero.svg"
            >
              <source src="/assets/videos/video.mp4" type="video/mp4" />
              Your browser is not supported.
            </video>
            <div className="absolute top-4 right-4 bg-blue-800 text-white px-3 py-1 rounded-full text-sm font-semibold">
              🎬 Watch Demo
            </div>
          </div>
          
          {/* Additional Content Below Video */}
          <div className="mt-6 space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-lg border border-blue-100">
              <h4 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
                <span className="mr-2">📱</span>
                Mobile Optimized
              </h4>
              <p className="text-blue-700 text-sm">
                Access your healthcare insights on any device with our responsive platform.
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-lg border border-blue-100">
              <h4 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
                <span className="mr-2">🔒</span>
                HIPAA Compliant
              </h4>
              <p className="text-blue-700 text-sm">
                Enterprise-grade security ensuring your patient data is always protected.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-xl text-white">
              <h4 className="text-lg font-semibold mb-2 flex items-center">
                <span className="mr-2">⚡</span>
                Real-time Updates
              </h4>
              <p className="text-blue-100 text-sm">
                Get instant notifications and live data synchronization across all devices.
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-lg border border-blue-100">
              <h4 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
                <span className="mr-2">🌐</span>
                Cloud Integration
              </h4>
              <p className="text-blue-700 text-sm">
                Seamlessly integrate with existing healthcare systems and cloud infrastructure.
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-lg border border-blue-100">
              <h4 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
                <span className="mr-2">📊</span>
                Advanced Analytics
              </h4>
              <p className="text-blue-700 text-sm">
                Powerful data analysis tools for comprehensive healthcare insights and reporting.
              </p>
            </div>
            

          </div>
        </div>
        
        {/* Content - Right Side */}
        <div className="order-1 lg:order-2">
          <div className="space-y-6 h-full">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-blue-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🏆</span>
                </div>
                <h3 className="text-2xl font-bold text-blue-900">Real Results, Real Impact</h3>
              </div>
              <p className="text-blue-700 leading-relaxed mb-6">
                Our platform has demonstrated measurable improvements across multiple healthcare metrics, 
                proving that AI-driven healthcare can deliver exceptional results for both patients and providers.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-900 mb-1">250%</div>
                  <div className="text-sm text-blue-600 font-medium">Faster Diagnosis</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-900 mb-1">95%</div>
                  <div className="text-sm text-blue-600 font-medium">Patient Satisfaction</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100">
              <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                <span className="mr-2">📊</span>
                Key Performance Indicators
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Treatment Accuracy</span>
                  <span className="font-semibold text-blue-900">98.5%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: '98.5%'}}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Response Time</span>
                  <span className="font-semibold text-blue-900">2.3s</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: '85%'}}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Cost Efficiency</span>
                  <span className="font-semibold text-blue-900">40%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: '40%'}}></div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8 rounded-2xl text-white">
              <h4 className="text-xl font-semibold mb-4 flex items-center">
                <span className="mr-2">🚀</span>
                Ready to Transform Your Practice?
              </h4>
              <p className="text-blue-100 mb-6 text-base">
                Join thousands of healthcare providers who are already experiencing the benefits 
                of AI-powered healthcare insights.
              </p>
              <button
                onClick={onSignIn}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg"
              >
                Start Your Free Trial
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional Stats Row */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="text-center bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="text-3xl font-bold text-blue-900 mb-2">250%</div>
          <div className="text-sm text-blue-600 font-medium">Faster Diagnosis</div>
        </div>
        <div className="text-center bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="text-3xl font-bold text-blue-900 mb-2">95%</div>
          <div className="text-sm text-blue-600 font-medium">Patient Satisfaction</div>
        </div>
        <div className="text-center bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="text-3xl font-bold text-blue-900 mb-2">40%</div>
          <div className="text-sm text-blue-600 font-medium">Cost Reduction</div>
        </div>
        <div className="text-center bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="text-3xl font-bold text-blue-900 mb-2">99.9%</div>
          <div className="text-sm text-blue-600 font-medium">Uptime Reliability</div>
        </div>
      </div>
    </div>
  </section>
      <Footer />
    </div>
  );
};

export default LandingPage;


