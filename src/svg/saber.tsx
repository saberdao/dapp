import React from 'react';

export default function Saber(props: { className?: string }) {
    return (
        <svg
            className={props.className}
            width="21"
            height="22"
            viewBox="0 0 21 22"
            fill="currentcolor"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M20.8861 1.54432C20.8861 0.967563 20.4185 0.500012 19.8418 0.500012L4.13862 0.5C3.45243 0.5 2.85201 0.599529 2.33736 0.798589C1.82272 1.01296 1.39384 1.29624 1.05075 1.64843C0.693353 2.01592 0.428883 2.42936 0.257335 2.88873C0.0857855 3.36341 8.50456e-06 3.85341 8.50456e-06 4.35872V6.76582C8.50456e-06 7.91933 0.93511 8.85443 2.08862 8.85443H14.6203L8.35446 4.67722H19.8418C20.4185 4.67722 20.8861 4.20966 20.8861 3.63291V1.54432ZM0 20.3417C0 20.9185 0.46755 21.3861 1.0443 21.3861L16.7475 21.3861C17.4337 21.3861 18.0341 21.2865 18.5487 21.0875C19.0634 20.8731 19.4922 20.5898 19.8353 20.2376C20.1927 19.8701 20.4572 19.4567 20.6288 18.9973C20.8003 18.5226 20.8861 18.0327 20.8861 17.5273V15.1202C20.8861 13.9667 19.951 13.0316 18.7975 13.0316H6.26581L12.5316 17.2088H1.0443C0.46755 17.2088 0 17.6764 0 18.2532V20.3417Z"
            ></path>
        </svg>
    );
}
