import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Threesby Test Page</h1>
      <p className="mb-4">This is a simple test page to verify that the application is running correctly.</p>
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Application Status</h2>
        <p className="text-green-600">✅ Application is running correctly!</p>
      </div>
    </div>
  );
};

export default TestPage;
