import { useEffect, useState } from 'react';
import { X, Play, CheckCircle, Users, Settings, Zap } from 'lucide-react';

// Add type declarations for the Chatling global objects
declare global {
  interface Window {
    chtlConfig?: {
      chatbotId: string;
      hideChatButton?: boolean;
    };
    Chatling?: {
      open: () => void;
      close: () => void;
    };
  }
}

const Home = () => {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false);
  type ProductKey = 'Solar Panels' | 'Smart Inverters' | 'Battery Storage';
  type ProductDetails = {
    icon: string;
    description: string;
    features: string[];
    specifications: string[];
  };
  const [selectedProduct, setSelectedProduct] = useState<ProductKey | null>(null);

  // Product data for modals
  const productDetails: Record<ProductKey, ProductDetails> = {
    'Solar Panels': {
      icon: '☀️',
      description: 'Our premium monocrystalline solar panels deliver industry-leading efficiency rates of up to 22%. Built to withstand extreme weather conditions with a 25-year performance warranty.',
      features: [
        '440W high-efficiency panels',
        'Anti-reflective coating',
        'Corrosion-resistant aluminum frame',
        'Temperature coefficient: -0.35%/°C',
        'Hail resistant up to 25mm diameter'
      ],
      specifications: [
        'Dimensions: 2094 x 1038 x 35mm',
        'Weight: 22.5kg',
        'Cell Type: Monocrystalline PERC',
        'Operating Temperature: -40°C to +85°C'
      ]
    },
    'Smart Inverters': {
      icon: '⚡',
      description: 'Advanced string inverters with built-in Wi-Fi monitoring, allowing real-time performance tracking and remote diagnostics. Optimize energy production with smart MPPT technology.',
      features: [
        'WiFi & Ethernet connectivity',
        'Real-time monitoring app',
        '99.5% peak efficiency',
        'Rapid shutdown compliance',
        'Weather-resistant enclosure (IP65)'
      ],
      specifications: [
        'Power Range: 3kW - 10kW',
        'Input Voltage: 150V - 1000V DC',
        'Output: 230V/400V AC',
        'Operating Temperature: -25°C to +60°C'
      ]
    },
    'Battery Storage': {
      icon: '🔋',
      description: 'Lithium iron phosphate (LiFePO4) battery systems providing reliable backup power and energy independence. Seamlessly integrate with your solar system for 24/7 clean energy.',
      features: [
        'Modular expandable design',
        '10-year warranty',
        '6000+ cycle life',
        'Intelligent battery management',
        'AC & DC coupling options'
      ],
      specifications: [
        'Capacity: 5kWh - 20kWh',
        'Voltage: 51.2V nominal',
        'Charge/Discharge: 100A continuous',
        'Operating Temperature: 0°C to 50°C'
      ]
    }
  };

  useEffect(() => {
    // Enhanced scroll animation
    const revealOnScroll = () => {
      const reveals = document.querySelectorAll('.reveal');
      
      for (let i = 0; i < reveals.length; i++) {
        const windowHeight = window.innerHeight;
        const elementTop = reveals[i].getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
          reveals[i].classList.add('active');
        }
      }
    };

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();
    return () => window.removeEventListener('scroll', revealOnScroll);
  }, []);

  useEffect(() => {
    // Load Chatling script when component mounts
    const script = document.createElement('script');
    script.async = true;
    script.dataset.id = "9798584874";
    script.id = "chtl-script";
    script.type = "text/javascript";
    script.src = "https://chatling.ai/js/embed.js";
    
    // Add configuration
    window.chtlConfig = { 
      chatbotId: "9798584874",
      hideChatButton: true
    };
    
    document.head.appendChild(script);
    
    // Cleanup function
    return () => {
      const existingScript = document.getElementById('chtl-script');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
      delete window.chtlConfig;
    };
  }, []);

  const handleEmployeeLogin = () => {
    window.location.href = '/employee-login'; 
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleWatchDemo = () => {
    setShowVideoModal(true);
  };

  const handleLearnMore = (productTitle: ProductKey) => {
    setSelectedProduct(productTitle);
    setShowLearnMoreModal(true);
  };

  const handleStartJourney = () => {
    // Navigate to employee login for consultation booking
    window.location.href = '/employee-login';
  };

  const VideoModal = () => (
    <div className={`fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 ${showVideoModal ? 'visible' : 'invisible'}`}>
      <div className="bg-white rounded-2xl w-full max-w-4xl relative">
        <button 
          onClick={() => setShowVideoModal(false)}
          className="absolute -top-4 -right-4 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-600 transition-colors z-10"
        >
          <X size={24} />
        </button>
        
        <div className="p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Solar Energy Demo Video</h3>
          
          {/* Video Container */}
          <div className="relative bg-gradient-to-br from-blue-900 to-green-800 rounded-xl overflow-hidden">
            <div className="aspect-video flex items-center justify-center">
              {/* Placeholder for actual video - replace with real video embed */}
              <div className="text-center text-white">
                <div className="mb-4">
                  <Play size={64} className="mx-auto mb-4 opacity-80" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Solar Installation Process</h4>
                <p className="text-gray-200 mb-4">See how our expert team transforms homes with clean energy</p>
                
                {/* Demo Video Content */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mx-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-400" />
                      <span>Site Assessment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-400" />
                      <span>Custom Design</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-400" />
                      <span>Professional Install</span>
                    </div>
                  </div>
                </div>
                
                {/* Replace this section with actual video embed */}
                <div className="mt-6">
                  <iframe 
                    className="w-full h-64 rounded-lg"
                    src="https://www.youtube.com/embed/dHvjmpbabhI"
                    title="Solar Demo Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                  <p className="text-xs text-gray-300 mt-2">* Replace with your actual solar demonstration video</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const LearnMoreModal = () => {
    const product = selectedProduct ? productDetails[selectedProduct] : null;
    
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 ${showLearnMoreModal ? 'visible' : 'invisible'}`}>
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
          <button 
            onClick={() => setShowLearnMoreModal(false)}
            className="absolute -top-4 -right-4 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-600 transition-colors z-10"
          >
            <X size={24} />
          </button>
          
          {product && (
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{product.icon}</div>
                <h3 className="text-3xl font-bold text-gray-800 mb-2">{selectedProduct}</h3>
                <div className="w-20 h-1 bg-gradient-to-r from-green-500 to-blue-500 mx-auto"></div>
              </div>
              
              <p className="text-gray-600 text-lg leading-relaxed mb-8">{product.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Zap className="text-green-500" size={20} />
                    Key Features
                  </h4>
                  <ul className="space-y-2">
                    {product.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Settings className="text-blue-500" size={20} />
                    Specifications
                  </h4>
                  <ul className="space-y-2">
                    {product.specifications.map((spec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-600">{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <button 
                  onClick={() => {
                    setShowLearnMoreModal(false);
                    handleEmployeeLogin();
                  }}
                  className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-3 rounded-full font-semibold hover:from-green-600 hover:to-blue-600 transform hover:scale-105 transition-all"
                >
                  Get Custom Quote
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-x-hidden">
      {/* Enhanced Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md shadow-lg z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            ☀️ SolarPower Pro
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-700">
            <button onClick={() => scrollToSection('features')} className="hover:text-green-600 transition-colors">Features</button>
            <button onClick={() => scrollToSection('products')} className="hover:text-green-600 transition-colors">Products</button>
            <button onClick={() => scrollToSection('testimonials')} className="hover:text-green-600 transition-colors">Stories</button>
            <button onClick={() => scrollToSection('contact')} className="hover:text-green-600 transition-colors">Contact</button>
          </div>
          <div className="flex gap-4">
            <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-full hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-lg"
             onClick={handleEmployeeLogin}
            >
              Employee Login
            </button>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-green-800 to-blue-900"></div>
        <div className="absolute inset-0 bg-black/30"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 opacity-20">
          <div className="absolute w-12 h-12 bg-yellow-400 rounded-full top-10 left-10 animate-pulse shadow-2xl"></div>
          <div className="absolute top-0 left-0 w-32 h-32 border-2 border-dashed border-white/50 rounded-full animate-spin" style={{animationDuration: '20s'}}>
            <div className="absolute -top-2 left-16 w-4 h-4 bg-green-400 rounded-full shadow-lg"></div>
            <div className="absolute top-16 -right-2 w-3 h-3 bg-blue-400 rounded-full shadow-lg"></div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-32 left-16 text-yellow-400 text-6xl opacity-60 animate-bounce">⚡</div>
        <div className="absolute bottom-32 right-32 text-green-400 text-4xl opacity-40 animate-pulse">🌱</div>
        
        {/* Main Content */}
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-6xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-green-200 to-blue-200 bg-clip-text text-transparent leading-tight">
            Power Your Future
          </h1>
          <div className="text-2xl md:text-3xl mb-6 font-light text-green-200">
            with Clean Solar Energy
          </div>
          <p className="text-xl max-w-3xl mx-auto mb-12 text-gray-200 leading-relaxed">
            Premium solar solutions that save money, reduce carbon footprint, and provide energy independence for your home or business
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={handleWatchDemo}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-10 py-4 rounded-full font-semibold text-lg hover:from-green-600 hover:to-green-700 transform hover:-translate-y-2 hover:shadow-2xl transition-all flex items-center justify-center gap-2"
            >
              <Play size={20} />
              Watch Demo
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-gray-800 to-green-600 bg-clip-text text-transparent">
              Why Choose Our Solutions
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-blue-500 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of energy with our cutting-edge solar technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '⭐', title: 'Premium Quality', desc: '25+ year warranties with industry-leading efficiency ratings', color: 'from-yellow-400 to-orange-500' },
              { icon: '💰', title: 'Maximum Savings', desc: 'Reduce bills by up to 90% with smart energy management', color: 'from-green-400 to-blue-500' },
              { icon: '🌍', title: 'Eco Impact', desc: 'Prevent 100,000+ lbs of CO2 emissions over system lifetime', color: 'from-green-500 to-teal-500' }
            ].map((feature, index) => (
              <div key={index} className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-4 transition-all duration-300 reveal border border-gray-100">
                <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">{feature.title}</h3>
                <p className="text-gray-600 text-center leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Products Section */}
      <section id="products" className="py-24 bg-gradient-to-br from-blue-50 via-green-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Our Product Range
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-green-500 mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { title: 'Solar Panels', desc: 'High-efficiency panels with 22% conversion rates', gradient: 'from-yellow-400 to-orange-500' },
              { title: 'Smart Inverters', desc: 'WiFi-enabled with real-time monitoring', gradient: 'from-blue-400 to-purple-500' },
              { title: 'Battery Storage', desc: 'Lithium-ion systems for 24/7 power', gradient: 'from-green-400 to-teal-500' }
            ].map((product, index) => (
              <div key={index} className="group bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transform hover:-translate-y-6 transition-all duration-500 reveal">
                <div className={`h-64 bg-gradient-to-br ${product.gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="w-12 h-12 bg-white/20 rounded-full backdrop-blur-sm flex items-center justify-center text-2xl mb-2">
                      ⚡
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">{product.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{product.desc}</p>
                  <button 
                    onClick={() => handleLearnMore(product.title as ProductKey)}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-full font-semibold hover:from-green-600 hover:to-blue-600 transform hover:scale-105 transition-all"
                  >
                    Learn More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials */}
      <section id="testimonials" className="py-24 bg-gradient-to-r from-gray-900 to-blue-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6">Customer Success Stories</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-blue-400 mx-auto"></div>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 text-center border border-white/20">
              <div className="text-6xl mb-8">💬</div>
              <p className="text-2xl italic mb-8 leading-relaxed">
                "Our solar system with battery backup has been incredible. 85% reduction in electricity bills and complete power security during outages. The installation team was professional and the monitoring app is fantastic."
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-2xl">
                  👨
                </div>
                <div>
                  <p className="font-bold text-xl">Michael Johnson</p>
                  <p className="text-green-400">Verified Customer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-32 bg-gradient-to-br from-green-600 via-blue-600 to-purple-700 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-6xl font-bold mb-8">Ready to Go Solar?</h2>
          <p className="text-2xl mb-12 max-w-3xl mx-auto opacity-90">
            Join thousands of satisfied customers who've made the switch to clean, affordable solar energy
          </p>
          <button 
            onClick={handleStartJourney}
            className="bg-white text-gray-800 px-12 py-5 rounded-full font-bold text-xl hover:bg-gray-100 transform hover:-translate-y-2 hover:shadow-2xl transition-all flex items-center gap-3 mx-auto"
          >
            <Users size={24} />
            Start Your Solar Journey
          </button>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {[
              {
                title: 'SolarPower Pro',
                items: ['Leading renewable energy solutions provider since 2010', 'Trusted by 10,000+ customers nationwide']
              },
              {
                title: 'Products',
                items: ['Residential Solar', 'Commercial Systems', 'Battery Storage', 'Smart Monitoring']
              },
              {
                title: 'Services',
                items: ['Free Consultation', 'Custom Design', 'Professional Installation', '24/7 Support']
              },
              {
                title: 'Contact',
                items: ['📧 info@solarpowerpro.com', '📞 (555) 123-4567', '📍 123 Green Energy Boulevard']
              }
            ].map((section, index) => (
              <div key={index}>
                <h3 className="text-xl font-bold mb-6 text-green-400">{section.title}</h3>
                <ul className="space-y-3">
                  {section.items.map((item, i) => (
                    <li key={i} className="text-gray-300 hover:text-white transition-colors">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="text-center pt-8 border-t border-gray-700">
            <p className="text-gray-400">&copy; 2025 SolarPower Pro. All Rights Reserved. | Powering a Sustainable Future</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <VideoModal />
      <LearnMoreModal />

      {/* Chatling Chatbot Button - Preserving your design */}
      <div className="fixed bottom-6 right-6 z-50">
      </div>

      <style>{`
        .reveal {
          opacity: 0;
          transform: translateY(50px);
          transition: all 0.8s ease;
        }
        .reveal.active {
          opacity: 1;
          transform: translateY(0);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Home;
