import Drawer from '../components/drawer.tsx';
import TextField from '@mui/material/TextField';
import FileUploadIcon from '@mui/icons-material/FileUpload';

const chatInterface = () => {
  return (
    <>
    <Drawer/>
    <div className="chat-container">
      <div className="messages">
        {/* Chat messages will be rendered here */}
      </div>
      <div className="input-area">
        <FileUploadIcon style={{ cursor: 'pointer', marginRight: '10px' }} />
              <TextField id="outlined-basic" sx={{ backgroundColor: 'rgba(255, 255, 255, 1)', color: 'white', width: '500px' }} variant="outlined" placeholder='Type your message here!'/>
      </div> 
    </div>
    </>
  );
};

export default chatInterface;