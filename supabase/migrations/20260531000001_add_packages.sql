-- Insert the specified packages
INSERT INTO public.packages (name, description, price, duration_days)
VALUES 
('Free Trial', 'Try our service for 3 days', 0, 3),
('WhatsApp API', 'Full access to WhatsApp API', 500, 30);

INSERT INTO public.packages (name, description, price, duration_days)
VALUES ('Yearly Premium', 'Full access for one entire year', 5000, 365);