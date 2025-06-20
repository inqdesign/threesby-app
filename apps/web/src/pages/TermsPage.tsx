import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppBar } from '../components/AppBar';
import { Transition } from '@headlessui/react';

export function TermsPage() {
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
      <div className="fixed inset-0 z-50 bg-background overflow-auto">
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
            <div className="min-h-screen bg-background pb-20">
              {/* App Bar */}
              <AppBar 
                title="Terms & Conditions" 
                showBackButton={true} 
                onBack={handleBack}
              />
              
              <div className="p-4 md:p-8 flex justify-center">
                <div className="bg-card rounded-xl shadow-sm p-6 w-full max-w-[700px]">
                  <h2 className="text-xl font-semibold mb-4 text-foreground">ThreesBy – Terms and Conditions</h2>
                  
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground">
                      Last updated: June 8, 2025
                    </p>
                    
                    <p className="text-foreground mt-4">
                      Welcome to ThreesBy — a platform for thoughtful curation and personal expression. These Terms and Conditions govern your use of ThreesBy and your rights and responsibilities as a user.
                    </p>
                    
                    <p className="text-foreground mt-2">
                      By accessing or using ThreesBy (the "Service"), you agree to be bound by these Terms.
                    </p>
                    
                    <h3 className="font-semibold mt-6 mb-2 text-foreground">1. Who We Are</h3>
                    <p className="text-foreground">
                      ThreesBy is a digital platform where individuals share curated sets of books, objects, and places, expressed in groups of three. The service is operated by OnShelf Studio, based in South Korea.
                    </p>
                    
                    <h3 className="font-semibold mt-6 mb-2 text-foreground">2. Eligibility & Accounts</h3>
                    <p className="text-foreground">
                      To create or post on ThreesBy, you must:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-foreground">
                      <li>Be at least 16 years old</li>
                      <li>Register for an account with accurate information</li>
                      <li>Agree not to impersonate others or violate any laws</li>
                    </ul>
                    <p className="text-foreground mt-2">
                      We reserve the right to approve or reject account creation, particularly for curators submitting their first 9 items.
                    </p>
                    
                    <h3 className="font-semibold mt-6 mb-2 text-foreground">3. User Content</h3>
                    <p className="text-foreground">
                      When you create a Threes set, you retain full ownership of your content.
                    </p>
                    <p className="text-foreground mt-2">
                      By posting on ThreesBy, you grant us a non-exclusive, worldwide license to display, distribute, and promote your content within the platform and in materials related to ThreesBy (e.g. newsletters, social media features, editorial showcases).
                    </p>
                    <p className="text-foreground mt-2">
                      You are responsible for the content you post. Please avoid:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-foreground">
                      <li>Plagiarized, false, or misleading information</li>
                      <li>Infringing on intellectual property</li>
                      <li>Hate speech, discrimination, or harmful material</li>
                    </ul>
                    <p className="text-foreground mt-2">
                      We may remove content that violates these rules.
                    </p>
                    
                    <h3 className="font-semibold mt-6 mb-2 text-foreground">4. Brand & Paid Accounts (Coming Soon)</h3>
                    <p className="text-foreground">
                      ThreesBy may offer paid features or brand accounts in the future. These terms will be updated when that happens. We'll notify you in advance.
                    </p>
                    
                    <h3 className="font-semibold mt-6 mb-2 text-foreground">5. Use of External Content</h3>
                    <p className="text-foreground">
                      You may include links or references (e.g. to bookstores, product pages, map locations). You're responsible for ensuring those links are appropriate and safe.
                    </p>
                    <p className="text-foreground mt-2">
                      We are not responsible for third-party sites or services.
                    </p>
                    
                    <h3 className="font-semibold mt-6 mb-2 text-foreground">6. Platform Rights & Limitations</h3>
                    <p className="text-foreground">
                      We may:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-foreground">
                      <li>Change or improve the platform over time</li>
                      <li>Moderate user accounts or suspend accounts that violate our policies</li>
                      <li>Feature or promote certain content (e.g. "Top Threes" or "Curator Spotlights")</li>
                    </ul>
                    <p className="text-foreground mt-2">
                      We do not guarantee that the platform will be available at all times, and we are not liable for data loss or downtime.
                    </p>
                    
                    <h3 className="font-semibold mt-6 mb-2 text-foreground">7. Privacy & Data</h3>
                    <p className="text-foreground">
                      Your data is handled respectfully and in accordance with applicable data protection laws. For more information, see our <Link to="/privacy-policy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</Link>.
                    </p>
                    
                    <h3 className="font-semibold mt-6 mb-2 text-foreground">8. Termination</h3>
                    <p className="text-foreground">
                      You may delete your account at any time. We may suspend or terminate accounts that violate these terms.
                    </p>
                    
                    <h3 className="font-semibold mt-6 mb-2 text-foreground">9. Governing Law</h3>
                    <p className="text-foreground">
                      These terms are governed by the laws of South Korea. Any legal disputes must be resolved in that jurisdiction.
                    </p>
                    
                    <h3 className="font-semibold mt-6 mb-2 text-foreground">10. Contact</h3>
                    <p className="text-foreground">
                      If you have questions about these Terms, you can reach us at hello@threesby.com or via the contact form on the site.
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

export default TermsPage;
