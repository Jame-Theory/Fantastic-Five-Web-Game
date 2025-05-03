import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Profile({ username, backToGame }) {
  const [avatar, setAvatar] = useState(null);
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');

  // load existing avatar
  useEffect(() => {
    axios.get(`/api/auth/profile?username=${username}`)
      .then(r => setAvatar(r.data.avatar))
      .catch(() => {});
  }, [username]);

  // on file select
  const handleFile = e => {
    setMsg('');
    setFile(e.target.files[0]);
  };

  const handleUpload = async e => {
    e.preventDefault();
    if (!file) return setMsg("Pick a file first");
    const form = new FormData();
    form.append("username", username);
    form.append("avatar", file);
    try {
      await axios.post('/api/auth/avatar', form, {
        headers: { 'Content-Type':'multipart/form-data' }
      });
      // refresh preview
      const r = await axios.get(`/api/auth/profile?username=${username}`);
      setAvatar(r.data.avatar);
      setMsg("Uploaded!");
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
      <form onSubmit={handleUpload}>
        <input type="file" accept="image/png,image/jpeg" onChange={handleFile}/>
        <button type="submit">Upload</button>
      </form>
      {msg && <p>{msg}</p>}
      <button onClick={backToGame}>Back to Game</button>
    </div>
  );
}
