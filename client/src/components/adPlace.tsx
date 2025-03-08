import React from 'react';

interface Ad {
  id: string;
  image_path: string;
  open_in_new_tab: boolean;
}

interface AdsProps {
//   section: string;
//   ads: Record<string, Ad[]>;
}

const AdComponent: React.FC<AdsProps> = ({ }) => {
  return (
      <a
        href={`/advertise`}
        className={`vert-cta`}
      >
        <img
          src={`/imgs/AdWithUs_800x100_v1.png`}
          alt="Ad"
          
        />
      </a>
  );
};

export default AdComponent;
