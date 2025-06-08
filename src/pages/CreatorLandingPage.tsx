import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Users, Globe2, Package, BookOpen, ArrowRight } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

export function CreatorLandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const heroRef = React.useRef(null);
  const featuresRef = React.useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const isFeaturesInView = useInView(featuresRef, { threshold: 0 });
  const [isVideoLoaded, setIsVideoLoaded] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      navigate('/my-threes');
    }
  }, [user, navigate]);

  // Update nav state in parent component
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--nav-bg', isFeaturesInView ? 'white' : 'transparent');
    root.style.setProperty('--nav-text', isFeaturesInView ? '#111827' : 'white');
    root.style.setProperty('--nav-button-bg', isFeaturesInView ? '#111827' : 'white');
    root.style.setProperty('--nav-button-text', isFeaturesInView ? 'white' : '#111827');
  }, [isFeaturesInView]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0">
          <div 
            className={`absolute inset-0 bg-black/60 z-10 transition-opacity duration-1000 ${
              isVideoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <iframe
            src="https://www.youtube.com/embed/5YWsnJMAkO0?autoplay=1&controls=0&mute=1&loop=1&playlist=5YWsnJMAkO0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className={`w-full h-full absolute top-0 left-0 pointer-events-none transition-opacity duration-1000 object-cover ${
              isVideoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transform: 'scale(1.5)' }}
            onLoad={() => setIsVideoLoaded(true)}
          />
        </div>

        {/* Grid Overlay */}
        <div className="absolute inset-0 z-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ delay: 1, duration: 1 }}
            className="w-full h-full grid grid-cols-3 gap-px"
          >
            {[...Array(9)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="border border-white/10"
              />
            ))}
          </motion.div>
        </div>
        
        {/* Content */}
        <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-6xl md:text-8xl font-bold text-white mb-8"
            >
              Your Life,
              <br />
              in Threes
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-12"
            >
              Collect what you love. Share what defines you.
            </motion.p>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.8 }}
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,255,255,0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/onboarding')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full text-lg font-medium transition-all shadow-lg hover:shadow-xl"
            >
              Start Curating
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 1, repeat: Infinity, repeatType: "reverse" }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30"
        >
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/50 rounded-full" />
          </div>
        </motion.div>
      </div>

      {/* The Reflection Section */}
      <div ref={featuresRef} className="py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl font-bold mb-6">Take a Moment to Reflect</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              What books shaped you? What places moved you? What products define you?
              We've seen what you share. Now, we're inviting you to curate your best threes.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {['Books', 'Places', 'Products'].map((category, index) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-white rounded-2xl p-8 shadow-lg"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="aspect-square rounded-xl overflow-hidden mb-6"
                >
                  <img
                    src={`https://images.unsplash.com/photo-${
                      category === 'Books' 
                        ? '1544947950-fa07a98d237f'
                        : category === 'Places'
                        ? '1540959733332-eab4deabeeaf'
                        : '1516035069371-29a1b244cc32'
                    }`}
                    alt={category}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                <h3 className="text-2xl font-semibold mb-4">{category}</h3>
                <p className="text-gray-600">
                  Share the {category.toLowerCase()} that have made a lasting impact on your journey.
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Community Section */}
      <div className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Users className="w-10 h-10 text-blue-600" />
            </motion.div>
            <h2 className="text-4xl font-bold mb-6">Join Our Community</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Share, discover, inspire. Hundreds of curators are already here—showing their best, connecting through threes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[1, 2, 3].map((curator) => (
              <motion.div
                key={curator}
                whileHover={{ y: -10 }}
                className="bg-white rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full" />
                  <div>
                    <h3 className="font-semibold">Curator {curator}</h3>
                    <p className="text-sm text-gray-500">Creative Director</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="aspect-square rounded-lg bg-gray-100" />
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-blue-600 text-white py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6">Ready to Share Your Story?</h2>
            <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
              One step to start. Share your threes, inspire the world.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/onboarding')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-full text-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Join the Curators
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}