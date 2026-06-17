import { Setting } from "../models/index.js";

// Get Settings
export const getSettings = async (req, res, next) => {   // FIX 1: getSetting -> getSettings
    try {
        const settings = await Setting.findAll();

        const settingsObj = {};

        settings.forEach((s) => {
            settingsObj[s.key] = s.type === 'json'
                ? JSON.parse(s.value || '{}')
                : s.value;
        });

        res.json({ success: true, data: settingsObj });

    } catch (error) {
        next(error);
    }
};

// Update Settings
export const updateSettings = async (req, res, next) => {
    try {
        const updates = req.body;                         // FIX 2: req.body() -> req.body (not a function)

        for (const [key, value] of Object.entries(updates)) {  // FIX 3: `update` -> `updates`
            await Setting.upsert({
                key,
                value: typeof value === 'object'
                    ? JSON.stringify(value)
                    : String(value)
            });
        }

        res.json({
            success: true,
            message: 'Settings updated successfully'
        });

    } catch (error) {
        next(error);
    }
};

// Upload Logo
export const uploadLogo = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded.'
            });
        }

        const logoPath = `/uploads/logos/${req.file.filename}`;  // FIX 4: removed stray spaces

        await Setting.upsert({
            key:   'company_logo',
            value: logoPath,
            group: 'company',
            label: 'Company Logo'
        });

        res.json({
            success: true,
            message: 'Logo uploaded.',
            logoPath
        });

    } catch (error) {
        next(error);
    }
};