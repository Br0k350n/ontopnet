import React from 'react';
import { Helmet } from 'react-helmet-async';

interface HeadComponentProps {
  title: string;
  tag: string;
  isAdmin: boolean;
}

const HeadComponent: React.FC<HeadComponentProps> = ({ title, tag, isAdmin }) => {
  return (
    <Helmet>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{tag} - {title}</title>
      <script src="https://www.google.com/recaptcha/api.js?render=6LeBjtAqAAAAAO0pvBRYhBCrTzXp2tAC6bIbVA9p"></script>
      {!isAdmin && (
        <>
          {/* The Weglot scripts have been commented out as in the original template */}
          {/*
          <script type="text/javascript" src="https://cdn.weglot.com/weglot.min.js"></script>
          <script>
            // Weglot.initialize({
            //   api_key: 'wg_e37cd86c785bd6063c0586c2a477e8ce9'
            // });
          </script>
          */}
        </>
      )}
      <link rel="stylesheet" href="/styles.css" />

      {/* jQuery */}
      <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
      {/* DataTables JS */}
      <script src="https://cdn.datatables.net/1.11.5/js/jquery.dataTables.min.js"></script>

      {/* FontAwesome */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flag-icons/css/flag-icons.min.css" />

      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Anton+SC&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />

      {/* CKEditor CDN (Rich Text Editor) */}
      <script src="https://cdn.paddle.com/paddle/v2/paddle.js"></script>

      {isAdmin && (
        <link rel="stylesheet" href="/admin.css" />
      )}

      {/* Hotjar Tracking Code */}
      <script>
        {`
          (function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:5309823,hjsv:6};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
        `}
      </script>
    </Helmet>
  );
};

export default HeadComponent;
