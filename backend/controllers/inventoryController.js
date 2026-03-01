const Inventory = require('../models/Inventory');

// Funksion ndihmës për të kthyer emrin në email automatikisht
const formatToEmail = (name) => {
    if (!name) return "";
    // Kthehet në shkronja të vogla, hiqen hapësirat anash, 
    // dhe hapësira mes emrit/mbiemrit zëvendësohet me pikë
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, '.');
    // Nëse nuk e përmban @umib.net, ia shton automatikisht
    return cleanName.includes('@umib.net') ? cleanName : `${cleanName}@umib.net`;
};

// 1. Krijimi i një mjeti të ri
exports.createItem = async (req, res) => {
    try {
        let { description, serialNumber, location, value, status, assignedTo, quantity, unit, fundingSource } = req.body;
        
        const normalizedLocation = location ? location.trim().toUpperCase() : "PANJOHUR";
        const assignedEmail = formatToEmail(assignedTo);

        // Kontrollo nëse numri serial ekziston (përveç nëse është i zbrazët)
        if (serialNumber) {
            const serialExists = await Inventory.findOne({ serialNumber });
            if (serialExists) {
                return res.status(400).json({ message: "Ky numër serial ekziston në sistem!" });
            }
        }

        const newItem = await Inventory.create({
            description,
            serialNumber,
            location: normalizedLocation,
            value,
            status,
            assignedTo: assignedEmail,
            quantity: quantity || 1,
            unit: unit || 'copë',
            fundingSource: fundingSource || 'Buxheti i Kosovës',
            createdBy: req.user.id 
        });

        res.status(201).json({
            message: "Mjeti u shtua me sukses.",
            data: newItem
        });
    } catch (error) {
        res.status(500).json({ message: "Gabim gjatë krijimit: " + error.message });
    }
};

// 2. Marrja e të gjitha mjeteve (me Filtra dhe Role)
exports.getItems = async (req, res) => {
    try {
        const { location, status, valueRange, search } = req.query;
        let query = {};

        // --- LOGJIKA E ROLIT ---
        // admin dhe super_viewer shohin gjithçka. Të tjerët shohin vetëm mjetet e tyre.
        const isAdmin = req.user.role === 'admin';
        const isSuperViewer = req.user.role === 'super_viewer';

        if (!isAdmin && !isSuperViewer) {
            query.assignedTo = req.user.email.toLowerCase().trim(); 
        }

        // Filtra sipas Lokacionit
        if (location && location !== 'KREJT FK') {
            query.location = location.trim().toUpperCase();
        }

        // Filtra sipas Statusit
        if (status && status !== 'all') {
            query.status = status;
        }

        // Filtra sipas Vlerës
        if (valueRange === 'low') query.value = { $lt: 1000 };
        if (valueRange === 'high') query.value = { $gte: 1000 };

        // Kërkimi (Search)
        if (search) {
            query.$or = [
                { description: { $regex: search, $options: 'i' } },
                { serialNumber: { $regex: search, $options: 'i' } },
                { assignedTo: { $regex: search, $options: 'i' } }
            ];
        }

        const items = await Inventory.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 }); // Mjetet më të reja dalin të parat

        res.json(items);
    } catch (error) {
        res.status(500).json({ message: "Gabim gjatë marrjes së të dhënave: " + error.message });
    }
};

// 3. Importi në masë (Bulk Insert)
exports.bulkInsert = async (req, res) => {
    try {
        let items = req.body; 
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Lista e dërguar është bosh!" });
        }

        const processedItems = items.map(item => ({
            ...item,
            location: item.location ? item.location.trim().toUpperCase() : "PANJOHUR",
            assignedTo: formatToEmail(item.assignedTo),
            createdBy: req.user.id
        }));

        const createdItems = await Inventory.insertMany(processedItems);
        res.status(201).json({ 
            message: `U importuan me sukses ${createdItems.length} pajisje.`,
            data: createdItems 
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Gabim: Disa pajisje kanë numra serialë duplikatë!" });
        }
        res.status(500).json({ message: "Gabim gjatë importit: " + error.message });
    }
};

// 4. Fshirja e një mjeti
exports.deleteItem = async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);
        if (!item) return res.status(404).json({ message: "Mjeti nuk u gjet!" });

        await Inventory.findByIdAndDelete(req.params.id);
        res.json({ message: "Mjeti u fshi me sukses." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};