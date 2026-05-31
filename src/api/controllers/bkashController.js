const bkashService = require('../../services/bkashService');
const { v4: uuidv4 } = require('uuid');

class BkashController {
    async makePayment(req, res) {
        try {
            const { amount, reference, name, email, phone } = req.body;
            
            // In a real app, you might get origin from headers or config
            const host = req.get('origin') || `${req.protocol}://${req.get('host')}`;
            const orderID = "Inv_" + uuidv4().substring(0, 10);
            
            const paymentDetails = {
                amount: amount || 1000,
                callbackURL: `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/bkash/callback`,
                orderID: orderID,
                reference: reference || "1",
                name: name,
                email: email,
                phone: phone,
            };

            const createPaymentResponse = await bkashService.createPayment(paymentDetails);
            
            if (createPaymentResponse.statusCode !== "0000") {
                return res.status(400).json({ 
                    message: "Payment Initiation Failed", 
                    details: createPaymentResponse.statusMessage 
                });
            }

            return res.json({ 
                message: "Payment Initiated Successfully", 
                url: createPaymentResponse.bkashURL 
            });
        } catch (error) {
            console.error("Bkash Controller Make Payment Error:", error);
            return res.status(500).json({ message: "Something went wrong" });
        }
    }

    async callback(req, res) {
        try {
            const { paymentID, status } = req.query;
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

            if (status === 'cancel' || status === 'failure') {
                return res.redirect(`${frontendUrl}/payment/cancel`);
            }

            if (!paymentID) {
                return res.redirect(`${frontendUrl}/payment/cancel`);
            }

            const executePaymentResponse = await bkashService.executePayment(paymentID);

            if (!executePaymentResponse || executePaymentResponse.statusCode !== "0000") {
                console.error("Bkash Execution Failed:", executePaymentResponse);
                return res.redirect(`${frontendUrl}/payment/cancel`);
            }

            // Payment successful
            // Here you would typically update your database (e.g. mark order as paid)
            
            return res.redirect(`${frontendUrl}/payment/success`);
        } catch (error) {
            console.error("Bkash Controller Callback Error:", error);
            return res.status(500).json({ message: "Something went wrong" });
        }
    }
}

module.exports = new BkashController();