import Login from '../pages/Login';

const AddAccountModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return <Login isModal={true} onClose={onClose} />;
};

export default AddAccountModal;
