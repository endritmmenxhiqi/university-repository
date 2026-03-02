const Inventory = require('../models/Inventory');
const StatusLog = require('../models/StatusLog');

// --- FUNKSIONET NDIHMËSE (Private) ---

// Kthen emrin në email: "Filan Fisteku" -> "filan.fisteku@umib.net"
const formatToEmail = (name) => {
    if (!name) return "";
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, '.');
    return cleanName.includes('@umib.net') ? cleanName : `${cleanName}@umib.net`;
};

// Gjeneron një barkod unik UIBM-XXXXX
const generateUniqueSN = async () => {
    let isUnique = false;
    let sn = "";
    while (!isUnique) {
        const random5Digit = Math.floor(10000 + Math.random() * 90000);
        sn = `UIBM-${random5Digit}`;
        const existing = await Inventory.findOne({ serialNumber: sn });
        if (!existing) isUnique = true;
    }
    return sn;
};

// --- EXPORTS ---

// 1. KRIJIMI I NJË MJETI TË RI
exports.createItem = async (req, res) => {
    try {
        let { description, serialNumber, location, value, status, assignedTo, quantity, unit, fundingSource } = req.body;
        
        // Auto-gjenerimi i barkodit nëse lihet bosh
        if (!serialNumber || serialNumber.trim() === "") {
            serialNumber = await generateUniqueSN();
        } else {
            const serialExists = await Inventory.findOne({ serialNumber });
            if (serialExists) {
                return res.status(400).json({ message: "Ky numër serial ekziston në sistem!" });
            }
        }

        const newItem = await Inventory.create({
            description: description.trim(),
            serialNumber,
            location: location ? location.trim().toUpperCase() : "PANJOHUR",
            value: Number(value) || 0,
            status: status || 'ne_perdorim',
            assignedTo: formatToEmail(assignedTo),
            quantity: Number(quantity) || 1,
            unit: unit || 'copë',
            fundingSource: fundingSource || 'Buxheti i Kosovës',
            createdBy: req.user.id 
        });

        res.status(201).json({ message: "Mjeti u shtua me sukses.", data: newItem });
    } catch (error) {
        res.status(500).json({ message: "Gabim gjatë krijimit: " + error.message });
    }
};

// 2. MARRJA E TË GJITHA MJETEVE (Me filtra dhe role)
exports.getItems = async (req, res) => {
    try {
        const { location, status, valueRange, search } = req.query;
        let query = {};

        // Kontrolli i qasjes sipas rolit
        const userRole = req.user.role?.toLowerCase();
        const isAdmin = userRole === 'admin';
        const isSuperViewer = userRole === 'super_viewer' || userRole === 'superviewer';

        if (!isAdmin && !isSuperViewer) {
            // Viewer-at shohin vetëm mjetet e tyre
            const emailPrefix = req.user.email.split('@')[0];
            query.assignedTo = { $regex: emailPrefix, $options: 'i' };
        }

        // Filtrat e kërkimit
        if (location && location !== 'KREJT FK') query.location = location.trim().toUpperCase();
        if (status && status !== 'all') query.status = status;
        if (valueRange === 'low') query.value = { $lt: 1000 };
        if (valueRange === 'high') query.value = { $gte: 1000 };

        if (search) {
            query.$or = [
                { description: { $regex: search, $options: 'i' } },
                { serialNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const items = await Inventory.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(items);
    } catch (error) {
        res.status(500).json({ message: "Gabim gjatë marrjes: " + error.message });
    }
};

// 3. NDRYSHIMI I STATUSIT (Me Logim)
exports.updateStatus = async (req, res) => {
    try {
        const { status, reason } = req.body;
        const item = await Inventory.findById(req.params.id);
        
        if (!item) return res.status(404).json({ message: "Aseti nuk u gjet" });
        
        const oldStatus = item.status;
        item.status = status;
        await item.save();

        await StatusLog.create({
            assetId: item._id,
            oldStatus,
            newStatus: status,
            reason: reason || "Ndryshim manual",
            changedBy: req.user.name || req.user.email 
        });

        res.json({ message: "Statusi u përditësua", data: item });
    } catch (error) { 
        res.status(400).json({ message: "Përditësimi dështoi: " + error.message }); 
    }
};

// 4. HISTORIKU I STATUSIT
exports.getHistory = async (req, res) => {
    try {
        const history = await StatusLog.find({ assetId: req.params.id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. IMPORTI NË MASË (BULK)
exports.bulkInsert = async (req, res) => {
    try {
        let items = req.body; 
        if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "Lista është bosh!" });

        const processedItems = items.map(item => ({
            ...item,
            location: item.location ? item.location.trim().toUpperCase() : "PANJOHUR",
            assignedTo: formatToEmail(item.assignedTo),
            createdBy: req.user.id
        }));

        const createdItems = await Inventory.insertMany(processedItems);
        res.status(201).json({ message: `U importuan ${createdItems.length} pajisje.`, data: createdItems });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: "Gabim: Barkod duplikat!" });
        res.status(500).json({ message: error.message });
    }
};

// 6. FSHIRJA
exports.deleteItem = async (req, res) => {
    try {
        const item = await Inventory.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ message: "Mjeti nuk u gjet!" });
        res.json({ message: "U fshi me sukses." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};