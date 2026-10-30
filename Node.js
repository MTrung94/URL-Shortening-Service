const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'urls.json');

app.use(express.json());

const loadData = () => {
    if (!fs.existsSync(DATA_FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch {
        return {};
    }
};

const saveData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
};

const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch {
        return false;
    }
};

app.post('/api/shorten', (req, res) => {
    const { originalUrl } = req.body;

    if (!originalUrl || !isValidUrl(originalUrl)) {
        return res.status(400).json({ error: 'URL không hợp lệ' });
    }

    const urls = loadData();
    const shortId = Math.random().toString(36).substring(2, 8);

    urls[shortId] = {
        originalUrl,
        clicks: 0,
        createdAt: new Date().toISOString()
    };

    saveData(urls);

    res.status(201).json({
        shortId,
        shortUrl: `http://localhost:${PORT}/${shortId}`,
        originalUrl
    });
});

app.get('/:shortId', (req, res) => {
    const { shortId } = req.params;
    const urls = loadData();
    const record = urls[shortId];

    if (!record) {
        return res.status(404).json({ error: 'Không tìm thấy URL' });
    }

    record.clicks += 1;
    saveData(urls);

    res.redirect(301, record.originalUrl);
});

app.get('/api/stats/:shortId', (req, res) => {
    const { shortId } = req.params;
    const urls = loadData();
    const record = urls[shortId];

    if (!record) {
        return res.status(404).json({ error: 'Không tìm thấy URL' });
    }

    res.json({ shortId, ...record });
});

app.put('/api/shorten/:shortId', (req, res) => {
    const { shortId } = req.params;
    const { newOriginalUrl } = req.body;

    if (!newOriginalUrl || !isValidUrl(newOriginalUrl)) {
        return res.status(400).json({ error: 'URL mới không hợp lệ' });
    }

    const urls = loadData();
    if (!urls[shortId]) {
        return res.status(404).json({ error: 'Không tìm thấy URL' });
    }

    urls[shortId].originalUrl = newOriginalUrl;
    urls[shortId].updatedAt = new Date().toISOString();
    saveData(urls);

    res.json({ message: 'Cập nhật thành công', shortId, newOriginalUrl });
});

app.delete('/api/shorten/:shortId', (req, res) => {
    const { shortId } = req.params;
    const urls = loadData();

    if (!urls[shortId]) {
        return res.status(404).json({ error: 'Không tìm thấy URL' });
    }

    delete urls[shortId];
    saveData(urls);

    res.json({ message: 'Đã xóa thành công' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
