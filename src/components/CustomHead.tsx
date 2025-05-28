'use client';

import { useEffect } from 'react';
import Script from 'next/script';

/**
 * CustomHead component injects a script that runs immediately to clean up 
 * any attributes that might cause hydration mismatches
 */
export default function CustomHead() {
  useEffect(() => {
    // Cleanup function that runs on client-side
    const cleanupBodyAttributes = () => {
      try {
        const body = document.body;
        const attributeNames = body.getAttributeNames();

        attributeNames.forEach(attr => {
          // Common patterns of browser extension attributes
          if (
            attr.startsWith('__') ||
            attr.includes('processed') ||
            attr.includes('register') ||
            attr.includes('bis_') ||
            attr.includes('extension')
          ) {
            body.removeAttribute(attr);
          }
        });
      } catch (error) {
        console.error('Error cleaning up body attributes:', error);
      }
    };

    // Run cleanup immediately
    cleanupBodyAttributes();

    // Set up a mutation observer to handle dynamically added attributes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.target === document.body) {
          cleanupBodyAttributes();
        }
      });
    });

    // Start observing the body for attribute changes
    observer.observe(document.body, { attributes: true });

    // Clean up the observer on component unmount
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Run this script as early as possible to prevent hydration mismatches */}
      <Script id="cleanup-body-attributes" strategy="beforeInteractive">
        {`
          (function() {
            try {
              var body = document.body;
              if (body) {
                var attrs = body.attributes;
                var attributesToRemove = [];
                
                for (var i = 0; i < attrs.length; i++) {
                  var attrName = attrs[i].name;
                  if (
                    attrName.startsWith('__') || 
                    attrName.includes('processed') || 
                    attrName.includes('register') || 
                    attrName.includes('bis_') ||
                    attrName.includes('extension')
                  ) {
                    attributesToRemove.push(attrName);
                  }
                }
                
                // Remove identified attributes
                attributesToRemove.forEach(function(attr) {
                  body.removeAttribute(attr);
                });
              }
            } catch (e) {
              console.error('Error in cleanup script:', e);
            }
          })();
        `}
      </Script>
    </>
  );
} 