import React from 'react';
import LocationSelector from './LocationSelector';

interface LocationUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    userData?: {
        city?: string;
        district?: string;
    };
}

const LocationUpdateModal: React.FC<LocationUpdateModalProps> = ({ isOpen, onClose, userData }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Cập nhật vị trí</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                
                <p className="text-gray-600 mb-4">
                    Để tìm kiếm người dùng phù hợp gần bạn, vui lòng cập nhật vị trí của bạn.
                </p>

                <LocationSelector 
                    onLocationUpdate={() => {
                        onClose();
                        window.location.reload();
                    }}
                    initialCity={userData?.city}
                    initialDistrict={userData?.district}
                />
            </div>
        </div>
    );
};

export default LocationUpdateModal; 