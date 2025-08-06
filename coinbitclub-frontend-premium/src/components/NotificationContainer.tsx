import React from 'react';
import { useNotifications } from '../contexts/NotificationContext.simple';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  InformationCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />;
      case 'error':
        return <XCircleIcon className="h-6 w-6 text-red-400" />;
      default:
        return <InformationCircleIcon className="h-6 w-6 text-blue-400" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-900 border-green-500';
      case 'warning':
        return 'bg-yellow-900 border-yellow-500';
      case 'error':
        return 'bg-red-900 border-red-500';
      default:
        return 'bg-blue-900 border-blue-500';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-4">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`max-w-sm w-full shadow-lg rounded-lg pointer-events-auto border ${getBackgroundColor(notification.type)} backdrop-blur-sm`}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getIcon(notification.type)}
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-white">
                  {notification.message}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="rounded-md inline-flex text-gray-400 hover:text-gray-200 focus:outline-none"
                  onClick={() => removeNotification(notification.id)}
                >
                  <span className="sr-only">Fechar</span>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;


