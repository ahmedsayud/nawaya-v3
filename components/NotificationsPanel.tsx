
import React from 'react';
import { useUser } from '../context/UserContext';
import { BellIcon, CloseIcon, TrashIcon } from './icons';
import { timeSince } from '../utils';

interface NotificationsPanelProps {
  onClose: () => void;
  isMobile?: boolean;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ onClose, isMobile = false }) => {
  const { notifications, markNotificationAsRead, deleteNotification } = useUser();

  const handleNotificationClick = async (notificationId: string | number) => {
    await markNotificationAsRead(notificationId);
  };

  const handleDeleteClick = async (e: React.MouseEvent, notificationId: string | number) => {
    e.stopPropagation(); // منع تفعيل click على الإشعار
    await deleteNotification(notificationId);
  };

  const content = (
    <>
      <div className="p-4 border-b border-fuchsia-500/30 flex justify-between items-center flex-shrink-0 bg-black/20 backdrop-blur-xl">
        <h3 className="font-bold text-white text-base">الإشعارات</h3>
        {isMobile && (
          <button
            onClick={onClose}
            className="p-2 -m-2 rounded-full text-slate-300 hover:bg-white/20 hover:text-white"
            aria-label="إغلاق الإشعارات"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        )}
      </div>
      <div className={`custom-scrollbar ${isMobile ? 'flex-grow overflow-y-auto' : 'max-h-96 overflow-y-auto'}`}>
        {notifications.length > 0 ? (
          [...notifications].reverse().map(notification => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification.id)}
              className={`p-4 border-b border-white/5 hover:bg-white/5 transition-all duration-200 flex gap-x-4 items-start relative group cursor-pointer ${!notification.read ? 'bg-fuchsia-900/10' : ''
                }`}
            >
              <div className="flex-shrink-0 pt-1">
                <div className={`p-2 rounded-full ${!notification.read ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'bg-slate-700/30 text-slate-500 group-hover:text-slate-300'}`}>
                  <BellIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-grow min-w-0">
                <p className={`text-sm mb-1 break-words ${!notification.read ? 'text-white font-bold' : 'text-slate-300'}`}>{notification.message}</p>
                <p className="text-fuchsia-400/60 text-xs font-medium">{timeSince(notification.timestamp)}</p>
              </div>
              {!notification.read && <span className="absolute top-4 left-4 h-2 w-2 rounded-full bg-fuchsia-500 animate-pulse"></span>}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteClick(e, notification.id);
                }}
                className="flex-shrink-0 p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                aria-label="حذف الإشعار"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full min-h-[200px]">
            <div className="relative mb-4">
              <BellIcon className="w-16 h-16 text-fuchsia-500/20" />
            </div>
            <p className="font-bold text-white text-base">لا توجد إشعارات جديدة</p>
            <p className="text-xs text-slate-500 mt-1">سنخبرك بآخر التحديثات هنا.</p>
          </div>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="h-full flex flex-col bg-theme-header-gradient">
        {content}
      </div>
    )
  }

  return (
    <div className="absolute top-full right-0 mt-4 w-80 sm:w-96 bg-theme-header-gradient rounded-2xl shadow-2xl border border-fuchsia-500/30 z-50 overflow-hidden ring-1 ring-black/50">
      {content}
    </div>
  );
};

export default NotificationsPanel;
