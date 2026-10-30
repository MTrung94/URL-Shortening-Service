const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const urls = {};

app.post('/api/shorten', (req, res) => {
    const { originalUrl } = req.body;
    if (!originalUrl) {
        return res.status(400).json({ error: 'Thiếu đường dẫn originalUrl' });
    }
    
    const shortId = Math.random().toString(36).substring(2, 8);
    urls[shortId] = {
        originalUrl,
        clicks: 0,
        createdAt: new Date()
    };

    res.status(201).json({
        shortId,
        shortUrl: `http://localhost:${PORT}/${shortId}`,
        originalUrl
    });
});

app.get('/:shortId', (req, res) => {
    const { shortId } = req.params;
    const record = urls[shortId];

    if (!record) {
        return res.status(404).json({ error: 'Không tìm thấy URL rút gọn này' });
    }

    record.clicks += 1;
    res.redirect(record.originalUrl);
});

app.get('/api/stats/:shortId', (req, res) => {
    const { shortId } = req.params;
    const record = urls[shortId];
    if (!record) {
        return res.status(404).json({ error: 'Không tìm thấy URL' });
    }
    res.json({ shortId, ...record });
});

app.put('/api/shorten/:shortId', (req, res) => {
    const { shortId } = req.params;
    const { newOriginalUrl } = req.body;

    if (!urls[shortId]) {
        return res.status(404).json({ error: 'Không tìm thấy URL' });
    }

    urls[shortId].originalUrl = newOriginalUrl;
    res.json({ message: 'Cập nhật thành công', shortId, newOriginalUrl });
});

app.delete('/api/shorten/:shortId', (req, res) => {
    const { shortId } = req.params;
    if (!urls[shortId]) {
        return res.status(404).json({ error: 'Không tìm thấy URL' });
    }

    delete urls[shortId];
    res.json({ message: 'Đã xóa thành công' });
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
