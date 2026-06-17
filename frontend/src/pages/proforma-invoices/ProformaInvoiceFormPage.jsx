// ─── ProformaInvoiceFormPage.jsx ──────────────────────────────────────────────
import { useState, useEffect } from "react";
import {
  tokens, fmt, Btn, Card, Input, Textarea, SectionDivider,
  PageHeader, Spinner, StatCard, useToast, ToastProvider, pageStyle,
} from "../shared.jsx";
import { proformaService, clientService, productService } from "../../services/api.js";

const UNITS     = ["Nos","Pcs","Kg","Ltr","Mtr","Set","Box","Bag","Pair","Roll"];
const GST_RATES = [0, 5, 12, 18, 28];
const TAX_MODES = [
  { value:"intra", label:"Intra-state (CGST + SGST)" },
  { value:"inter", label:"Inter-state (IGST)"         },
];
const STATUS_OPTS = [
  { value:"draft",    label:"Draft"    },
  { value:"sent",     label:"Sent"     },
  { value:"approved", label:"Approved" },
];

const emptyItem = () => ({
  _id:        Math.random().toString(36).slice(2),
  productId:  "",
  description:"",
  hsnCode:    "",
  quantity:   1,
  unit:       "Nos",
  unitPrice:  0,
  gstRate:    18,
  cgstAmount: 0,
  sgstAmount: 0,
  igstAmount: 0,
  totalPrice: 0,
});

function recalcItem(item, taxMode) {
  const qty   = parseFloat(item.quantity)  || 0;
  const price = parseFloat(item.unitPrice) || 0;
  const rate  = parseFloat(item.gstRate)   || 0;
  const base  = qty * price;
  const gst   = parseFloat(((base * rate) / 100).toFixed(2));
  const half  = parseFloat((gst / 2).toFixed(2));
  return {
    ...item,
    cgstAmount: taxMode === "intra" ? half : 0,
    sgstAmount: taxMode === "intra" ? half : 0,
    igstAmount: taxMode === "inter" ? gst  : 0,
    totalPrice: parseFloat((base + gst).toFixed(2)),
  };
}

function ProformaInvoiceFormInner({ piId, onSaved, onCancel }) {
  const toast  = useToast();
  const isEdit = !!piId;

  const [clients,  setClients]  = useState([]);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [initLoad, setInitLoad] = useState(isEdit);
  const [taxMode,  setTaxMode]  = useState("intra");
  const [errors,   setErrors]   = useState({});

  const [form, setForm] = useState({
    clientId:   "",
    piDate:     new Date().toISOString().slice(0,10),
    validUntil: new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0,10),
    status:     "draft",
    notes:      "",
    items:      [emptyItem()],
  });

  useEffect(() => {
    Promise.all([
      clientService.getAll({ limit:200 }),
      productService.getAll({ limit:200 }),
    ])
      .then(([c, p]) => {
        setClients(c.data.data  || []);
        setProducts(p.data.data || []);
      })
      .catch(e => toast(e.response?.data?.message || e.message, "error"));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    proformaService.getOne(piId)
      .then(r => {
        const pi = r.data.data;
        setForm({
          clientId:   pi.clientId        || "",
          piDate:     pi.piDate?.slice(0,10)     || "",
          validUntil: pi.validUntil?.slice(0,10) || "",
          status:     pi.status          || "draft",
          notes:      pi.notes           || "",
          items: (pi.items || []).map(it => ({
            _id:        Math.random().toString(36).slice(2),
            productId:  it.productId   || "",
            description:it.description || "",
            hsnCode:    it.hsnCode     || "",
            quantity:   parseFloat(it.quantity)   || 1,
            unit:       it.unit        || "Nos",
            unitPrice:  parseFloat(it.unitPrice)  || 0,
            gstRate:    parseFloat(it.gstRate)    || 18,
            cgstAmount: parseFloat(it.cgstAmount) || 0,
            sgstAmount: parseFloat(it.sgstAmount) || 0,
            igstAmount: parseFloat(it.igstAmount) || 0,
            totalPrice: parseFloat(it.totalPrice) || 0,
          })),
        });
        if ((pi.items || [])[0]?.igstAmount > 0) setTaxMode("inter");
      })
      .catch(e => toast(e.response?.data?.message || e.message, "error"))
      .finally(() => setInitLoad(false));
  }, [piId]);

  useEffect(() => {
    setForm(f => ({ ...f, items: f.items.map(it => recalcItem(it, taxMode)) }));
  }, [taxMode]);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const setItem = (idx, k, v) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = recalcItem({ ...items[idx], [k]: v }, taxMode);
      return { ...f, items };
    });
  };

  const applyProduct = (idx, productId) => {
    const p = products.find(x => x.id === productId);
    if (!p) { setItem(idx, "productId", productId); return; }
    setForm(f => {
      const items = [...f.items];
      items[idx] = recalcItem({
        ...items[idx],
        productId,
        description: p.name,
        hsnCode:     p.hsnCode || "",
        unit:        p.unit    || "Nos",
        unitPrice:   parseFloat(p.price)   || 0,
        gstRate:     parseFloat(p.gstRate) || 18,
      }, taxMode);
      return { ...f, items };
    });
  };

  const addItem    = () => setForm(f => ({ ...f, items:[...f.items, emptyItem()] }));
  const removeItem = idx => setForm(f => ({ ...f, items: f.items.filter((_,i)=>i!==idx) }));

  const subtotal   = form.items.reduce((s,it) => s + (parseFloat(it.unitPrice)||0)*(parseFloat(it.quantity)||0), 0);
  const cgstSum    = form.items.reduce((s,it) => s + parseFloat(it.cgstAmount||0), 0);
  const sgstSum    = form.items.reduce((s,it) => s + parseFloat(it.sgstAmount||0), 0);
  const igstSum    = form.items.reduce((s,it) => s + parseFloat(it.igstAmount||0), 0);
  const gstTotal   = cgstSum + sgstSum + igstSum;
  const grandTotal = subtotal + gstTotal;

  const validate = () => {
    const e = {};
    if (!form.clientId)   e.clientId   = "Client is required";
    if (!form.piDate)     e.piDate     = "PI date is required";
    if (!form.validUntil) e.validUntil = "Valid until is required";
    if (form.items.length === 0) e.items = "Add at least one item";
    form.items.forEach((it, i) => {
      if (!it.description) e[`item_${i}_desc`] = "Required";
      if (it.quantity <= 0) e[`item_${i}_qty`] = "Must be > 0";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) { toast("Please fix form errors", "error"); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        subtotal,
        gstAmount:   gstTotal,
        totalAmount: grandTotal,
        dueAmount:   grandTotal,
        items: form.items.map(({ _id, ...rest }) => rest),
      };
      if (isEdit) {
        await proformaService.update(piId, payload);
        toast("Proforma invoice updated");
      } else {
        await proformaService.create(payload);
        toast("Proforma invoice created");
      }
      onSaved?.();
    } catch(e) { toast(e.response?.data?.message || e.message, "error"); }
    finally    { setLoading(false); }
  };

  if (initLoad) return (
    <div style={{ ...pageStyle, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <Spinner size={40}/>
    </div>
  );

  const clientOpts  = [{ value:"", label:"— Select Client —" },  ...clients.map(c=>({ value:c.id, label:`${c.name}${c.company?` (${c.company})`:""}`}))];
  const productOpts = [{ value:"", label:"— Select Product —" }, ...products.map(p=>({ value:p.id, label:p.name }))];

  return (
    <div style={pageStyle}>
      <PageHeader
        title={isEdit ? "Edit Proforma Invoice" : "New Proforma Invoice"}
        subtitle={isEdit ? `Editing PI ${piId}` : "Create a new proforma invoice"}
        actions={
          <>
            {onCancel && <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>}
            <Btn variant="primary" onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving…" : isEdit ? "Update PI" : "Create PI"}
            </Btn>
          </>
        }
      />

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:20, marginBottom:20 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <Card style={{ padding:"20px 24px" }}>
            <SectionDivider label="Basic Details"/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginTop:14 }}>
              <FS label="Client *" value={form.clientId} onChange={e=>setField("clientId",e.target.value)}
                options={clientOpts} error={errors.clientId}/>
              <Input label="PI Date *" type="date" value={form.piDate}
                onChange={e=>setField("piDate",e.target.value)} error={errors.piDate}/>
              <Input label="Valid Until *" type="date" value={form.validUntil}
                onChange={e=>setField("validUntil",e.target.value)} error={errors.validUntil}/>
              <FS label="Status" value={form.status} onChange={e=>setField("status",e.target.value)}
                options={STATUS_OPTS}/>
              <div style={{ gridColumn:"1/-1" }}>
                <FS label="Tax Type" value={taxMode} onChange={e=>setTaxMode(e.target.value)}
                  options={TAX_MODES}/>
              </div>
            </div>
          </Card>
          <Card style={{ padding:"20px 24px" }}>
            <Textarea label="Notes" rows={3} value={form.notes}
              onChange={e=>setField("notes",e.target.value)} placeholder="Notes for client…"/>
          </Card>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <StatCard label="Subtotal" value={fmt.currency(subtotal)}   icon="📊"/>
          {taxMode==="intra" && <>
            <StatCard label="CGST"  value={fmt.currency(cgstSum)}    icon="🏛"/>
            <StatCard label="SGST"  value={fmt.currency(sgstSum)}    icon="🏛"/>
          </>}
          {taxMode==="inter" &&
            <StatCard label="IGST"  value={fmt.currency(igstSum)}    icon="🏛"/>
          }
          <StatCard label="Total"   value={fmt.currency(grandTotal)} icon="💰" color={tokens.success}/>
        </div>
      </div>

      <Card style={{ marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"16px 20px", borderBottom:`1px solid ${tokens.border}` }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color: tokens.text }}>Line Items</h3>
          <Btn size="sm" variant="primary" onClick={addItem} icon="＋">Add Item</Btn>
        </div>
        {errors.items && (
          <p style={{ color: tokens.danger, fontSize:13, padding:"8px 20px", margin:0 }}>{errors.items}</p>
        )}
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:900 }}>
            <thead>
              <tr>
                {["Product","Description","HSN","Qty","Unit","Unit Price","GST %",
                  taxMode==="intra"?"CGST":"IGST",
                  taxMode==="intra"?"SGST":"",
                  "Total",""].filter(Boolean).map(h => (
                  <th key={h} style={{
                    padding:"10px 12px", fontSize:12, color: tokens.textSub, fontWeight:600,
                    textTransform:"uppercase", borderBottom:`1px solid ${tokens.border}`,
                    textAlign:"left", whiteSpace:"nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, idx) => (
                <tr key={item._id} style={{ borderBottom:`1px solid ${tokens.border}20` }}>
                  <td style={cs(160)}>
                    <select value={item.productId} onChange={e=>applyProduct(idx,e.target.value)} style={sel}>
                      {productOpts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </td>
                  <td style={cs(180)}>
                    <input value={item.description} onChange={e=>setItem(idx,"description",e.target.value)}
                      placeholder="Description *"
                      style={{ ...inp, borderColor: errors[`item_${idx}_desc`]?tokens.danger:tokens.border }}/>
                  </td>
                  <td style={cs(90)}>
                    <input value={item.hsnCode} onChange={e=>setItem(idx,"hsnCode",e.target.value)}
                      placeholder="HSN" style={inp}/>
                  </td>
                  <td style={cs(70)}>
                    <input type="number" min="0" value={item.quantity}
                      onChange={e=>setItem(idx,"quantity",parseFloat(e.target.value)||0)}
                      style={{ ...inp, borderColor: errors[`item_${idx}_qty`]?tokens.danger:tokens.border }}/>
                  </td>
                  <td style={cs(90)}>
                    <select value={item.unit} onChange={e=>setItem(idx,"unit",e.target.value)} style={sel}>
                      {UNITS.map(u=><option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                  <td style={cs(100)}>
                    <input type="number" min="0" step="0.01" value={item.unitPrice}
                      onChange={e=>setItem(idx,"unitPrice",parseFloat(e.target.value)||0)} style={inp}/>
                  </td>
                  <td style={cs(80)}>
                    <select value={item.gstRate} onChange={e=>setItem(idx,"gstRate",parseFloat(e.target.value))} style={sel}>
                      {GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}
                    </select>
                  </td>
                  <td style={{ ...cs(90), color: tokens.textSub, fontSize:13 }}>
                    {taxMode==="intra" ? fmt.currency(item.cgstAmount) : fmt.currency(item.igstAmount)}
                  </td>
                  {taxMode==="intra" && (
                    <td style={{ ...cs(90), color: tokens.textSub, fontSize:13 }}>
                      {fmt.currency(item.sgstAmount)}
                    </td>
                  )}
                  <td style={{ ...cs(100), fontWeight:700, color: tokens.success }}>
                    {fmt.currency(item.totalPrice)}
                  </td>
                  <td style={{ padding:"8px 10px" }}>
                    <button onClick={()=>removeItem(idx)} disabled={form.items.length===1}
                      style={{ background:"none", border:"none", color:tokens.danger,
                        cursor:"pointer", fontSize:18, opacity:form.items.length===1?0.3:1 }}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end",
          padding:"16px 20px", borderTop:`1px solid ${tokens.border}` }}>
          <div style={{ width:300 }}>
            <TR label="Subtotal"    value={fmt.currency(subtotal)}/>
            {taxMode==="intra" && <>
              <TR label="CGST"      value={fmt.currency(cgstSum)}/>
              <TR label="SGST"      value={fmt.currency(sgstSum)}/>
            </>}
            {taxMode==="inter" && <TR label="IGST" value={fmt.currency(igstSum)}/>}
            <div style={{ height:1, background:tokens.border, margin:"8px 0" }}/>
            <TR label="Grand Total" value={fmt.currency(grandTotal)} bold color={tokens.success}/>
          </div>
        </div>
      </Card>

      <div style={{ display:"flex", gap:12, justifyContent:"flex-end" }}>
        {onCancel && <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>}
        <Btn variant="primary" onClick={handleSubmit} disabled={loading} size="lg">
          {loading ? "Saving…" : isEdit ? "Update Proforma Invoice" : "Create Proforma Invoice"}
        </Btn>
      </div>
    </div>
  );
}

function FS({ label, value, onChange, options, error }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      {label && <label style={{ fontSize:13, color:tokens.textSub, fontWeight:500 }}>{label}</label>}
      <select value={value} onChange={onChange} style={{
        background:tokens.elevated, border:`1px solid ${error?tokens.danger:tokens.border}`,
        color:tokens.text, borderRadius:8, padding:"9px 14px", fontSize:14,
        outline:"none", fontFamily:"inherit", cursor:"pointer", width:"100%",
      }}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span style={{ fontSize:12, color:tokens.danger }}>{error}</span>}
    </div>
  );
}

function TR({ label, value, bold, color }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"5px 0" }}>
      <span style={{ fontSize:13, color:tokens.textSub }}>{label}</span>
      <span style={{ fontSize:14, fontWeight:bold?700:500, color:color||tokens.text }}>{value}</span>
    </div>
  );
}

const cs  = w => ({ padding:"8px 10px", minWidth:w });
const inp = { background:tokens.elevated, border:`1px solid ${tokens.border}`, color:tokens.text,
  borderRadius:6, padding:"6px 10px", fontSize:13, outline:"none", fontFamily:"inherit",
  width:"100%", boxSizing:"border-box" };
const sel = { ...inp, cursor:"pointer" };

export default function ProformaInvoiceFormPage(props) {
  return <ToastProvider><ProformaInvoiceFormInner {...props}/></ToastProvider>;
}