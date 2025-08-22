import React from 'react';

// This component is no longer used and its functionality has been
// integrated into the Leaderboard and Header components which pull
// data directly from Supabase.
const ProfilePage: React.FC = () => {
  return (
    <div className="bg-[#0f1124] min-h-screen flex items-center justify-center text-white">
      <h1 className="text-2xl">This page is no longer in use.</h1>
    </div>
  );
};

export default ProfilePage;
