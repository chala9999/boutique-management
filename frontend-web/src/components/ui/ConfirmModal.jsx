import { X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmer', cancelText = 'Annuler', confirmVariant = 'primary' }) => {
  if (!isOpen) return null;

  const getConfirmClass = () => {
    switch(confirmVariant) {
      case 'danger':
        return 'btn-danger';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      default:
        return 'btn-primary';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600">{message}</p>
          <div className="flex items-center space-x-3 mt-6">
            <button onClick={onClose} className="flex-1 btn-secondary">
              {cancelText}
            </button>
            <button onClick={onConfirm} className={`flex-1 ${getConfirmClass()}`}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;