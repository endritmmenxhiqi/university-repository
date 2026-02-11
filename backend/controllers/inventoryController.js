const Inventory = require('../models/Inventory');

exports.createItem = async (req, res) => {
    try {
        let { description, serialNumber, location, value, status } = req.body;
        const normalizedLocation = location.trim().toUpperCase();

        const serialExists = await Inventory.findOne({ serialNumber });
        if (serialExists) {
            return res.status(400).json({ message: "Ky numër serial ekziston!" });
        }

        const locationExists = await Inventory.findOne({ location: normalizedLocation });
        
        const newItem = await Inventory.create({
            description,
            serialNumber,
            location: normalizedLocation,
            value,
            status,
            createdBy: req.user.id 
        });

        res.status(201).json({
            isNewLocation: !locationExists,
            message: !locationExists ? `Lokacioni i ri "${normalizedLocation}" u regjistrua!` : "U shtua me sukses.",
            data: newItem
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getItems = async (req, res) => {
    try {
        const { location, status, valueRange, search } = req.query;
        let query = {};

        if (location) query.location = location.trim().toUpperCase();
        if (status) query.status = status;
        if (valueRange === 'low') query.value = { $lte: 1000 };
        if (valueRange === 'high') query.value = { $gt: 1000 };

        if (search) {
            query.$or = [
                { description: { $regex: search, $options: 'i' } },
                { serialNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const items = await Inventory.find(query).populate('createdBy', 'name');
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.bulkInsert = async (req, res) => {
    try {
        let items = req.body; 
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Lista është bosh!" });
        }

        const processedItems = items.map(item => ({
            ...item,
            location: item.location.trim().toUpperCase(),
            createdBy: req.user.id
        }));

        const createdItems = await Inventory.insertMany(processedItems);
        res.status(201).json({ data: createdItems });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: "Gabim: Numra serialë duplikatë!" });
        res.status(500).json({ message: error.message });
    }
};