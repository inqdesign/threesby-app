import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppBar } from '../components/AppBar';
import { Transition } from '@headlessui/react';

export function PrivacyPolicyPage() {
  const navigate = useNavigate();
  
  // Animation states
  const [show, setShow] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  // Handle back navigation with animation
  const handleBack = () => {
    setIsExiting(true);
    // Wait for animation to complete before navigating
    setTimeout(() => {
      navigate('/settings');
    }, 300); // Match the duration of the animation
  };
  
  useEffect(() => {
    // Trigger animation after component mounts
    setShow(true);
  }, []);

  return (
    <Transition
      show={!isExiting}
      appear={true}
      enter="transition-opacity duration-75"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="fixed inset-0 z-50 bg-white overflow-auto">
        <div className="relative w-full h-full">
          <Transition
            show={show && !isExiting}
            appear={true}
            enter="transform transition duration-300 ease-out"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition duration-300 ease-in"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <div className="min-h-screen bg-gray-50 pb-20">
              {/* App Bar */}
              <AppBar 
                title="Privacy Policy" 
                showBackButton={true} 
                onBack={handleBack}
              />
              
              <div className="p-4 md:p-8 flex justify-center">
                <div className="bg-white rounded-xl shadow-sm p-6 w-full max-w-[700px]">
                  <h2 className="text-xl font-semibold mb-4">ThreesBy – Privacy Policy</h2>
                  
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700">
                      Last updated: June 8, 2025
                    </p>
                    
                    <p className="text-gray-700 mt-4">
                      At ThreesBy, we value your privacy and are committed to being transparent about how we collect and use your information. This Privacy Policy explains our practices regarding your personal data.
                    </p>
                    
                    <h3 className="font-semibold mt-6 mb-2">1. Information We Collect</h3>
                    <p className="text-gray-700">
                      We collect the following types of information:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-gray-700">
                      <li><strong>Account Information:</strong> When you register, we collect your name, email, username, and password</li>
                      <li><strong>Profile Information:</strong> Your bio, profile picture, and any other details you choose to share</li>
                      <li><strong>Content:</strong> Your curated picks, descriptions, and any media you upload</li>
                      <li><strong>Usage Data:</strong> How you interact with ThreesBy, including pages visited and features used</li>
                      <li><strong>Device Information:</strong> IP address, browser type, device type, and operating system</li>
                    </ul>
                    
                    <h3 className="font-semibold mt-6 mb-2">2. How We Use Your Information</h3>
                    <p className="text-gray-700">
                      We use your information to:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-gray-700">
                      <li>Provide and improve ThreesBy's features and functionality</li>
                      <li>Create and maintain your account</li>
                      <li>Display your profile and content to other users based on your settings</li>
                      <li>Recommend content that may interest you</li>
                      <li>Send important notifications about your account or the platform</li>
                      <li>Analyze usage patterns to enhance our service</li>
                      <li>Ensure the security and integrity of our platform</li>
                    </ul>
                    
                    <h3 className="font-semibold mt-6 mb-2">3. Information Sharing</h3>
                    <p className="text-gray-700">
                      We share your information in limited circumstances:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-gray-700">
                      <li><strong>Public Content:</strong> Your profile and picks are visible to other users according to your privacy settings</li>
                      <li><strong>Service Providers:</strong> We work with trusted third parties who help us operate ThreesBy (hosting, analytics, email delivery)</li>
                      <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
                    </ul>
                    <p className="text-gray-700 mt-2">
                      We do not sell your personal information to advertisers or other third parties.
                    </p>
                    
                    <h3 className="font-semibold mt-6 mb-2">4. Your Choices & Rights</h3>
                    <p className="text-gray-700">
                      You have several rights regarding your information:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-gray-700">
                      <li>Access and update your account information at any time</li>
                      <li>Control your privacy settings to determine what others can see</li>
                      <li>Request a copy of your data</li>
                      <li>Request deletion of your account and associated data</li>
                      <li>Opt out of promotional communications</li>
                    </ul>
                    <p className="text-gray-700 mt-2">
                      To exercise these rights, visit your account settings or contact us directly.
                    </p>
                    
                    <h3 className="font-semibold mt-6 mb-2">5. Data Security</h3>
                    <p className="text-gray-700">
                      We implement appropriate security measures to protect your information. However, no online service is completely secure. We encourage you to use strong passwords and be cautious about the information you share.
                    </p>
                    
                    <h3 className="font-semibold mt-6 mb-2">6. International Data Transfers</h3>
                    <p className="text-gray-700">
                      ThreesBy operates globally. Your information may be processed in countries with different data protection laws. When we transfer data internationally, we take steps to ensure adequate protection of your information.
                    </p>
                    
                    <h3 className="font-semibold mt-6 mb-2">7. Children's Privacy</h3>
                    <p className="text-gray-700">
                      ThreesBy is not intended for children under 16. We do not knowingly collect information from children under 16. If we discover we have collected information from a child under 16, we will delete it.
                    </p>
                    
                    <h3 className="font-semibold mt-6 mb-2">8. Changes to This Policy</h3>
                    <p className="text-gray-700">
                      We may update this Privacy Policy periodically. We'll notify you of significant changes through the platform or by email. Your continued use of ThreesBy after changes indicates your acceptance of the updated policy.
                    </p>
                    
                    <h3 className="font-semibold mt-6 mb-2">9. Contact Us</h3>
                    <p className="text-gray-700">
                      If you have questions about this Privacy Policy or your data, please contact us at privacy@threesby.com.
                    </p>
                    
                    <p className="text-gray-700 mt-6">
                      For more information about how we operate, please see our <Link to="/terms" className="text-blue-600 hover:underline">Terms and Conditions</Link>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  );
}

export default PrivacyPolicyPage;
