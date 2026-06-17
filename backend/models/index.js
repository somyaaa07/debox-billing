import sequelize from '../config/database.js';

import ActitvityLogModel from './ActivityLog.js';
import ClientModel from './Client.js';
import FinalInvoiceModel from './FinalInvoice.js';
import FinalInvoiceItemModel from './FinalInvoiceItem.js';
import PaymentModel from './Payment.js';
import ProductModel from './Product.js';
import ProformaInvoiceModel from './ProformaInvoice.js';
import ProformaInvoiceItemModel from './ProformaInvoiceItem.js';
import PurchaseOrderModel from './PurchaseOrder.js';
import PurchaseOrderItemModel from './PurchaseOrderItem.js';
import QuotationModel from './Quotation.js';
import QuotationItemModel from './QuotationItem.js';
import SettingModel from './Setting.js';
import UserModel from './User.js';

// Initialize models
const User               = UserModel(sequelize);
const ActivityLog        = ActitvityLogModel(sequelize);
const Client             = ClientModel(sequelize);
const FinalInvoice       = FinalInvoiceModel(sequelize);
const Payment            = PaymentModel(sequelize);
const Product            = ProductModel(sequelize);
const ProformaInvoice    = ProformaInvoiceModel(sequelize);
const ProformaInvoiceItem = ProformaInvoiceItemModel(sequelize);
const PurchaseOrder      = PurchaseOrderModel(sequelize);
const PurchaseOrderItem  = PurchaseOrderItemModel(sequelize);
const Quotation          = QuotationModel(sequelize);
const QuotationItem      = QuotationItemModel(sequelize);
const Setting            = SettingModel(sequelize);
const FinalInvoiceItem   = FinalInvoiceItemModel(sequelize);

// Associations

// Client -> Quotation
Client.hasMany(Quotation,    { foreignKey: 'clientId', as: 'quotations' });  // FIX 1-N: foreginKey -> foreignKey (all)
Quotation.belongsTo(Client,  { foreignKey: 'clientId', as: 'client'     });

// Quotation -> QuotationItems
Quotation.hasMany(QuotationItem,   { foreignKey: 'quotationId', as: 'items',     onDelete: 'CASCADE' });  // FIX: 'CASADE' -> 'CASCADE'
QuotationItem.belongsTo(Quotation, { foreignKey: 'quotationId', as: 'quotation'  });

// Product -> QuotationItems
Product.hasMany(QuotationItem,    { foreignKey: 'productId', as: 'quotationItems' });
QuotationItem.belongsTo(Product,  { foreignKey: 'productId', as: 'product'        });

// Client -> PurchaseOrder
Client.hasMany(PurchaseOrder,    { foreignKey: 'clientId', as: 'purchaseOrders' });
PurchaseOrder.belongsTo(Client,  { foreignKey: 'clientId', as: 'client'         });

// Quotation -> PurchaseOrder
Quotation.hasMany(PurchaseOrder,    { foreignKey: 'quotationId', as: 'purchaseOrders' });
PurchaseOrder.belongsTo(Quotation,  { foreignKey: 'quotationId', as: 'quotation'      });

// PurchaseOrder -> PurchaseOrderItems
PurchaseOrder.hasMany(PurchaseOrderItem,    { foreignKey: 'purchaseOrderId', as: 'items',         onDelete: 'CASCADE' });
PurchaseOrderItem.belongsTo(PurchaseOrder,  { foreignKey: 'purchaseOrderId', as: 'purchaseOrder'  });

// Product -> PurchaseOrderItems
Product.hasMany(PurchaseOrderItem,    { foreignKey: 'productId', as: 'poItems' });
PurchaseOrderItem.belongsTo(Product,  { foreignKey: 'productId', as: 'product' });

// Client -> ProformaInvoice
Client.hasMany(ProformaInvoice,    { foreignKey: 'clientId', as: 'proformaInvoices' });
ProformaInvoice.belongsTo(Client,  { foreignKey: 'clientId', as: 'client'           });

// PurchaseOrder -> ProformaInvoice
PurchaseOrder.hasMany(ProformaInvoice,    { foreignKey: 'purchaseOrderId', as: 'proformaInvoices' });
ProformaInvoice.belongsTo(PurchaseOrder,  { foreignKey: 'purchaseOrderId', as: 'purchaseOrder'    }); // FIX: was 'purchaseOrders'

// ProformaInvoice -> ProformaInvoiceItems
ProformaInvoice.hasMany(ProformaInvoiceItem,    { foreignKey: 'proformaInvoiceId', as: 'items',          onDelete: 'CASCADE' });
ProformaInvoiceItem.belongsTo(ProformaInvoice,  { foreignKey: 'proformaInvoiceId', as: 'proformaInvoice' }); // FIX: was 'proformaInoviceId'

// Client -> FinalInvoice
Client.hasMany(FinalInvoice,    { foreignKey: 'clientId', as: 'finalInvoices' });
FinalInvoice.belongsTo(Client,  { foreignKey: 'clientId', as: 'client'        });

// FinalInvoice -> FinalInvoiceItems
FinalInvoice.hasMany(FinalInvoiceItem,    { foreignKey: 'finalInvoiceId', as: 'items',       onDelete: 'CASCADE' });
FinalInvoiceItem.belongsTo(FinalInvoice,  { foreignKey: 'finalInvoiceId', as: 'finalInvoice' });

// ProformaInvoice -> FinalInvoice
ProformaInvoice.hasMany(FinalInvoice,    { foreignKey: 'proformaInvoiceId', as: 'finalInvoices'  });
FinalInvoice.belongsTo(ProformaInvoice,  { foreignKey: 'proformaInvoiceId', as: 'proformaInvoice' });

// Client -> Payment
Client.hasMany(Payment,    { foreignKey: 'clientId', as: 'payments' });
Payment.belongsTo(Client,  { foreignKey: 'clientId', as: 'client'   }); // FIX: was 'clients'

// FinalInvoice -> Payment
FinalInvoice.hasMany(Payment,    { foreignKey: 'finalInvoiceId', as: 'payments'     });
Payment.belongsTo(FinalInvoice,  { foreignKey: 'finalInvoiceId', as: 'finalInvoice' }); // FIX: was 'finalInovice'

// User -> ActivityLog
User.hasMany(ActivityLog,    { foreignKey: 'userId', as: 'logs' });
ActivityLog.belongsTo(User,  { foreignKey: 'userId', as: 'user' });

export {
    sequelize,
    User,
    Client,
    Product,
    Quotation,
    QuotationItem,
    PurchaseOrder,
    PurchaseOrderItem,
    ProformaInvoice,
    ProformaInvoiceItem,
    FinalInvoice,
    FinalInvoiceItem,
    Payment,
    Setting,
    ActivityLog
};