import { useState, useEffect } from 'react';
import axios from 'axios';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';

export default function Profile({ username, backToGame }) {
  const [avatar, setAvatar] = useState(null);
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');

  // for cropping
  const [imageSrc, setImageSrc] = useState(null);
  const [crop,     setCrop]     = useState({ x: 0, y: 0 });
  const [zoom,     setZoom]     = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // load existing avatar
  useEffect(() => {
    axios.get(`/api/auth/profile?username=${username}`)
      .then(r => setAvatar(r.data.avatar))
      .catch(() => {});
  }, [username]);

  // on file select
  const handleFile = e => {
    // setMsg('');
    // setFile(e.target.files[0]);
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result);
    reader.readAsDataURL(f);
  };

  const handleUpload = async e => {
    e.preventDefault();
    if (!file) return setMsg("Pick a file first");

    setMsg("Processing…");
    // grab the cropped blob
    const blob = croppedAreaPixels
      ? await getCroppedImg(imageSrc, croppedAreaPixels)
      : file;

    const form = new FormData();
    form.append("username", username);
    // form.append("avatar", file);
    form.append("avatar",  blob, file.name);

    try {
      await axios.post('/api/auth/avatar', form, {
        headers: { 'Content-Type':'multipart/form-data' }
      });
      // refresh preview
      const r = await axios.get(`/api/auth/profile?username=${username}`);
      setAvatar(r.data.avatar);
      setMsg("Uploaded!");
      setImageSrc(null);            // clear out the crop UI
    } catch {
      setMsg("Upload failed");
    }
  };

  return (
    <div className="profile-page">
      <h2>{username}’s Profile</h2>
      {avatar
        ? <img
            src={avatar}
            alt="Avatar"
            style={{
              width:128,
              height:128,
              objectFit:'cover',
              // borderRadius:'50%'
            }}
          />
        : <p>No avatar yet</p>
      }

      {/* ==== cropper UI ==== */}
      {imageSrc && (
        <>
          {/* 1) the cropping “viewport” */}
          <div
            style={{
              position: 'relative',
              width: '100%',    // or e.g. 300px
              maxWidth: 300,
              height: 300,
              background: '#333',
              margin: '1rem auto'
            }}
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
            />
          </div>

          {/* 2) a little zoom slider */}
          <div
              className="zoom-slider"
              style={{
                position: 'relative', // establish a new stacking context
                zIndex: 10, // high enough to sit on top of the cropper
                margin: '1rem 0',
                textAlign:'center'
              }}>
            <label style={{ marginRight: 8 }}>Zoom:</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              style={{ position: 'relative', zIndex: 11 }}
            />
          </div>
        </>
      )}

      <form onSubmit={handleUpload}>
        <input
            type="file"
            accept="image/png,image/jpeg"
            onClick={e => e.target.value = null}     // <— clear previous selection
            onChange={handleFile}/>
        <button type="submit">Upload</button>
      </form>
      {msg && <p>{msg}</p>}
      <button onClick={backToGame}>Back to Game</button>
    </div>
  );
}