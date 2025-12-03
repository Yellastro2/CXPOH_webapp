
import React from 'react';

export const PlusIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export const FolderIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" />
  </svg>
);

export const CloseIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg width="36" height="37" viewBox="0 0 36 37" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}    >
  <path d="M18 3.01648C9.705 3.01648 3 9.75824 3 18.0987C3 26.4392 9.705 33.181 18 33.181C26.295 33.181 33 26.4392 33 18.0987C33 9.75824 26.295 3.01648 18 3.01648ZM25.5 23.5132L23.385 25.6398L18 20.2253L12.615 25.6398L10.5 23.5132L15.885 18.0987L10.5 12.6842L12.615 10.5576L18 15.9721L23.385 10.5576L25.5 12.6842L20.115 18.0987L25.5 23.5132Z"
  fill="currentColor"/>
  </svg>
);

export const PhotoIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg width="36" height="37" viewBox="0 0 36 37" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
  <path d="M28.5 6.0329H7.5C5.835 6.0329 4.5 7.3903 4.5 9.04935V27.148C4.5 28.8071 5.835 30.1645 7.5 30.1645H13.5V27.148H7.5V12.0658H28.5V27.148H22.5V30.1645H28.5C30.15 30.1645 31.5 28.8071 31.5 27.148V9.04935C31.5 7.3903 30.165 6.0329 28.5 6.0329ZM18 15.0822L12 21.1151H16.5V30.1645H19.5V21.1151H24L18 15.0822Z"
  fill="currentColor"/>
  </svg>
);

export const MoveToFolderIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg width="36" height="38" viewBox="0 0 36 38" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}    >
  <path d="M3 9.30069H0V17.0513H0.015L0 31.0024C0 32.7075 1.35 34.1026 3 34.1026H30V31.0024H3V9.30069ZM33 6.20046H21L18 3.10022H9C7.35 3.10022 6.015 4.49533 6.015 6.20046L6 24.8019C6 26.507 7.35 27.9021 9 27.9021H33C34.65 27.9021 36 26.507 36 24.8019V9.30069C36 7.59556 34.65 6.20046 33 6.20046ZM10.5 23.2518L17.25 13.9511L22.5 20.9421L26.25 16.2762L31.5 23.2518H10.5Z" fill="white"/>
  </svg>
);

export const ShareIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg width="37" height="37" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}    >
  <path d="M30.8333 6.03284H6.16665C4.47081 6.03284 3.09873 7.39024 3.09873 9.04928L3.08331 27.148C3.08331 28.807 4.47081 30.1644 6.16665 30.1644H30.8333C32.5291 30.1644 33.9166 28.807 33.9166 27.148V9.04928C33.9166 7.39024 32.5291 6.03284 30.8333 6.03284ZM30.8333 12.0657L18.5 19.6068L6.16665 12.0657V9.04928L18.5 16.5904L30.8333 9.04928V12.0657Z" fill="white"/>
  </svg>
);

export const ExtraIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 36 37" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}    >
  <path d="M18 3.01648C9.72 3.01648 3 9.77332 3 18.0987C3 26.4241 9.72 33.181 18 33.181C26.28 33.181 33 26.4241 33 18.0987C33 9.77332 26.28 3.01648 18 3.01648ZM10.5 20.3611C9.255 20.3611 8.25 19.3505 8.25 18.0987C8.25 16.8469 9.255 15.8364 10.5 15.8364C11.745 15.8364 12.75 16.8469 12.75 18.0987C12.75 19.3505 11.745 20.3611 10.5 20.3611ZM18 20.3611C16.755 20.3611 15.75 19.3505 15.75 18.0987C15.75 16.8469 16.755 15.8364 18 15.8364C19.245 15.8364 20.25 16.8469 20.25 18.0987C20.25 19.3505 19.245 20.3611 18 20.3611ZM25.5 20.3611C24.255 20.3611 23.25 19.3505 23.25 18.0987C23.25 16.8469 24.255 15.8364 25.5 15.8364C26.745 15.8364 27.75 16.8469 27.75 18.0987C27.75 19.3505 26.745 20.3611 25.5 20.3611Z" fill="white"/>
  </svg>
);

export const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);

export const ChevronRightIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

export const DownloadIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg width="36" height="37" viewBox="0 0 36 37" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}    >
  <path d="M18 33.181C26.28 33.181 33 26.4241 33 18.0987C33 9.77332 26.28 3.01648 18 3.01648C9.72 3.01648 3 9.77332 3 18.0987C3 26.4241 9.72 33.181 18 33.181ZM16.5 18.0987L16.5 12.0658L19.5 12.0658L19.5 18.0987L24 18.0987L18 24.1316L12 18.0987L16.5 18.0987Z" fill="white"/>
  </svg>
);

export const CheckIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

export const SearchIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);
