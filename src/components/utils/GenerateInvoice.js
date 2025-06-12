import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Card,
  //   CardMedia,
  CardContent,
  Snackbar,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  //   RadioGroup,
  //   Radio,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  //   Refresh as RefreshIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { useSocket } from '../context/SocketContext';

const MegaInvoiceForm = () => {
  const [loading, setLoading] = useState(false);
  const [checkingUid, setCheckingUid] = useState(false);
  const [savingSender, setSavingSender] = useState(false);
  const [generatedDocuments, setGeneratedDocuments] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [uid, setUid] = useState('1234');
  const [senderViewMode, setSenderViewMode] = useState(false);
  const [isEditingSender, setIsEditingSender] = useState(false);
  const [originalSenderData, setOriginalSenderData] = useState(null);
  const { socket } = useSocket();

  // Document selection state
  const [selectedDocuments, setSelectedDocuments] = useState({
    proforma: false,
    tax: false,
    preshipment: false,
    packing: false,
    commercial: true,
  });

  const [formData, setFormData] = useState({
    // Company & Basic Information
    exporter: {
      company: 'Global Textiles Export Ltd.',
      address_line_1: '123 Industrial Estate, Block A',
      address_line_2: 'Near Mumbai Port Trust',
      city: 'Mumbai',
      state: 'Maharashtra',
      postcode: '400001',
      country: 'India',
      contact_person: 'Rajesh Kumar',
      telephone: '+91 22 2345 6789',
      email: 'export@globaltextiles.com',
      reference: 'GTE/2024/REF001',
      vat_no: 'exporter-vat',
    },

    // Invoice Details
    invoice_details: {
      invoice_number: 'GTE/INV/2024/001234',
      invoice_date: new Date().toISOString().split('T')[0],
      buyers_order_number: 'PO-2024-US-5678',
      buyers_order_date: '2024-03-15',
      exporter_reference: 'EXP/REF/2024/001',
    },

    // Parties Information
    consignee: {
      company: 'American Fashion Imports Inc.',
      address_line_1: '456 Fashion Avenue',
      address_line_2: 'Suite 200',
      city: 'New York',
      state: 'NY',
      postcode: '10001',
      country: 'USA',
      contact_person: 'John Smith',
      telephone: '+1 212 555 0123',
      email: 'imports@americanfashion.com',
      vat_no: 'consignee-vat',
    },

    buyer: {
      same_as_consignee: true,
      company: 'American Fashion Imports Inc.',
      address_line_1: '456 Fashion Avenue',
      address_line_2: 'Suite 200',
      city: 'New York',
      state: 'NY',
      postcode: '10001',
      country: 'USA',
      contact_person: 'John Smith',
      telephone: '+1 212 555 0123',
      email: 'imports@americanfashion.com',
      vat_no: 'buyer-vat',
    },

    // Shipping Details
    shipping: {
      pre_carriage_by: 'BY ROAD',
      place_of_receipt: 'Mumbai Factory',
      country_of_origin: 'India',
      country_of_destination: 'USA',
      vessel_flight_no: 'MSC MARINA / VOY 124W',
      port_of_loading: 'Nhava Sheva Port, Mumbai',
      port_of_discharge: 'Port of New York/Newark',
      final_destination: 'New York, USA',
      container_number: 'MSKU1234567',
    },

    // Payment & Terms
    terms: {
      delivery_terms: 'FOB Mumbai',
      payment_terms: '30% Advance, 70% Against B/L Copy',
      currency: 'USD',
    },

    // Products
    products: [
      {
        sr_no: '1',
        hs_code: '6109.10.00',
        marks_nos: 'AFI/NYC/2024',
        no_kind_packages: '100/1',
        type_of_packaging: 'Cartons',
        description: 'Cotton T-Shirts - White, Size M, Premium Quality',
        quantity: '5000',
        unit: 'PCS',
        rate_per_unit: '4.50',
        amount: '22500.00',
        tax_percentage: '0',
        tax_amount: '0.00',
        total_amount: '22500.00',
        net_weight: '1250',
        gross_weight: '1350',
      },
      {
        sr_no: '2',
        hs_code: '6109.10.00',
        marks_nos: 'AFI/NYC/2024',
        no_kind_packages: '80/1',
        type_of_packaging: 'Cartons',
        description: 'Cotton T-Shirts - Black, Size L, Premium Quality',
        quantity: '4000',
        unit: 'PCS',
        rate_per_unit: '4.75',
        amount: '19000.00',
        tax_percentage: '0',
        tax_amount: '0.00',
        total_amount: '19000.00',
        net_weight: '1040',
        gross_weight: '1120',
      },
      {
        sr_no: '3',
        hs_code: '6203.42.00',
        marks_nos: 'AFI/NYC/2024',
        no_kind_packages: '50/1',
        type_of_packaging: 'Cartons',
        description: 'Mens Cotton Trousers - Blue Denim, Assorted Sizes',
        quantity: '2000',
        unit: 'PCS',
        rate_per_unit: '12.00',
        amount: '24000.00',
        tax_percentage: '0',
        tax_amount: '0.00',
        total_amount: '24000.00',
        net_weight: '1600',
        gross_weight: '1700',
      },
    ],

    // Summary Information
    summary: {
      total_cartons: '230',
      total_net_weight: '3890.00',
      total_gross_weight: '4170.00',
      variation_percentage: '5',
      subtotal_amount: '65500.00',
      total_tax_amount: '0.00',
      total_amount: '65500.00',
      amount_in_words: 'Sixty Five Thousand Five Hundred USD Only',
    },

    // Banking Details
    banking: {
      bank_name: 'State Bank of India',
      bank_address:
        'International Banking Division, Fort Branch, Mumbai - 400001, India',
      swift_code: 'SBININBB104',
      account_number: '00000012345678901',
      beneficiary_name: 'Global Textiles Export Ltd.',
    },

    // Additional Details
    additional: {
      igst_status: 'Not Paid',
      lut_number: 'LUT/2024/MUM/00123',
      duty_drawback_claim: true,
      rodtep_claim: true,
      shipment_under_eut_scheme: false,
      supply_under_lut: true,
    },

    // Declaration
    declaration: {
      text: 'We declare that this Invoice shows the actual Price of the goods described and that all particulars are true and correct. The goods are of Indian origin.',
      authorized_signatory: 'Rajesh Kumar',
      company_stamp: true,
    },
  });

  // Also set the UID

  useEffect(() => {
    if (socket) {
      socket.on('documents-generated', (data) => {
        setGeneratedDocuments(data.documents);
      });
    }
  }, [socket]);

  const checkUid = async () => {
    if (!uid) {
      setError('Please enter a UID first');
      return;
    }

    setCheckingUid(true);
    setError('');

    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/sender-company/${uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Map old format to new format if needed
          const exporterData = data.data.exporter;
          if (exporterData.address && !exporterData.address_line_1) {
            // Old format with single address field
            exporterData.address_line_1 = exporterData.address;
            delete exporterData.address;
          }

          setFormData((prev) => ({
            ...prev,
            exporter: exporterData || prev.exporter,
            banking: data.data.banking || prev.banking,
          }));
          setOriginalSenderData({
            exporter: exporterData,
            banking: data.data.banking,
          });
          setSenderViewMode(true);
          setShowSuccess(true);
        }
      } else if (response.status === 404) {
        setError(
          'No existing company found for this UID. Please fill in the details.',
        );
        setSenderViewMode(false);
      } else {
        throw new Error('Failed to check UID');
      }
    } catch (err) {
      setError(err.message);
      setSenderViewMode(false);
    } finally {
      setCheckingUid(false);
    }
  };

  const saveSenderData = async () => {
    setSavingSender(true);
    setError('');

    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/sender-company`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid,
          exporter: formData.exporter,
          banking: formData.banking,
        }),
      });

      if (!response.ok) throw new Error('Failed to save sender data');

      const data = await response.json();
      if (data.success) {
        setOriginalSenderData({
          exporter: formData.exporter,
          banking: formData.banking,
        });
        setIsEditingSender(false);
        setShowSuccess(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingSender(false);
    }
  };

  const handleEditSender = () => {
    setIsEditingSender(true);
  };

  const handleCancelEdit = () => {
    setFormData((prev) => ({
      ...prev,
      exporter: originalSenderData.exporter,
      banking: originalSenderData.banking,
    }));
    setIsEditingSender(false);
  };

  const handleDocumentSelection = (event) => {
    setSelectedDocuments({
      ...selectedDocuments,
      [event.target.name]: event.target.checked,
    });
  };

  const handleInputChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleProductChange = (index, field, value) => {
    const newProducts = [...formData.products];
    newProducts[index] = {
      ...newProducts[index],
      [field]: value,
    };

    // Auto-calculations
    if (field === 'quantity' || field === 'rate_per_unit') {
      const qty = parseFloat(newProducts[index].quantity) || 0;
      const rate = parseFloat(newProducts[index].rate_per_unit) || 0;
      newProducts[index].amount = (qty * rate).toFixed(2);
    }

    if (field === 'amount' || field === 'tax_percentage') {
      const amount = parseFloat(newProducts[index].amount) || 0;
      const taxPct = parseFloat(newProducts[index].tax_percentage) || 0;
      newProducts[index].tax_amount = ((amount * taxPct) / 100).toFixed(2);
      newProducts[index].total_amount = (
        amount + parseFloat(newProducts[index].tax_amount)
      ).toFixed(2);
    }

    setFormData((prev) => ({ ...prev, products: newProducts }));
    updateTotals(newProducts);
  };

  const updateTotals = (products) => {
    const subtotal = products.reduce(
      (sum, p) => sum + parseFloat(p.amount || 0),
      0,
    );
    const totalTax = products.reduce(
      (sum, p) => sum + parseFloat(p.tax_amount || 0),
      0,
    );
    const total = subtotal + totalTax;
    const totalNetWeight = products.reduce(
      (sum, p) => sum + parseFloat(p.net_weight || 0),
      0,
    );
    const totalGrossWeight = products.reduce(
      (sum, p) => sum + parseFloat(p.gross_weight || 0),
      0,
    );

    setFormData((prev) => ({
      ...prev,
      summary: {
        ...prev.summary,
        subtotal_amount: subtotal.toFixed(2),
        total_tax_amount: totalTax.toFixed(2),
        total_amount: total.toFixed(2),
        total_net_weight: totalNetWeight.toFixed(2),
        total_gross_weight: totalGrossWeight.toFixed(2),
        amount_in_words:
          numberToWords(total) + ' ' + formData.terms.currency + ' Only',
      },
    }));
  };

  const numberToWords = (num) => {
    // Simple implementation - enhance as needed
    // const ones = [
    //   '',
    //   'One',
    //   'Two',
    //   'Three',
    //   'Four',
    //   'Five',
    //   'Six',
    //   'Seven',
    //   'Eight',
    //   'Nine',
    // ];
    // const tens = [
    //   '',
    //   '',
    //   'Twenty',
    //   'Thirty',
    //   'Forty',
    //   'Fifty',
    //   'Sixty',
    //   'Seventy',
    //   'Eighty',
    //   'Ninety',
    // ];
    // const teens = [
    //   'Ten',
    //   'Eleven',
    //   'Twelve',
    //   'Thirteen',
    //   'Fourteen',
    //   'Fifteen',
    //   'Sixteen',
    //   'Seventeen',
    //   'Eighteen',
    //   'Nineteen',
    // ];

    if (num === 0) return 'Zero';

    // For simplicity, just return the number formatted
    return num.toFixed(2);
  };

  const addProduct = () => {
    const newSrNo = (formData.products.length + 1).toString();
    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          sr_no: newSrNo,
          hs_code: '',
          marks_nos: '',
          no_kind_packages: '',
          type_of_packaging: '',
          description: '',
          quantity: '',
          unit: 'PCS',
          rate_per_unit: '',
          amount: '0.00',
          tax_percentage: '',
          tax_amount: '0.00',
          total_amount: '0.00',
          net_weight: '',
          gross_weight: '',
        },
      ],
    }));
  };

  const removeProduct = (index) => {
    const newProducts = formData.products.filter((_, i) => i !== index);
    // Update serial numbers
    newProducts.forEach((product, idx) => {
      product.sr_no = (idx + 1).toString();
    });
    setFormData((prev) => ({ ...prev, products: newProducts }));
    updateTotals(newProducts);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!uid) {
      setError('UID is required');
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/generate-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid,
          selectedDocuments,
          formData,
          socketId: socket?.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate documents');

      const data = await response.json();
      setGeneratedDocuments(data.documents);
      setShowSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderExporterSection = () => {
    if (senderViewMode && !isEditingSender) {
      // Card View Mode
      return (
        <Card variant="outlined" sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6" color="primary">
              Exporter Details
            </Typography>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEditSender}
              size="small"
            >
              Edit
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" mb={1}>
                <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Company
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formData.exporter.company}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" mb={1}>
                <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Contact Person
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formData.exporter.contact_person}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="flex-start" mb={1}>
                <LocationIcon
                  sx={{ mr: 1, color: 'text.secondary', mt: 0.5 }}
                />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Address
                  </Typography>
                  <Typography variant="body2">
                    {formData.exporter.address_line_1}
                    {formData.exporter.address_line_2 && <br />}
                    {formData.exporter.address_line_2}
                    <br />
                    {formData.exporter.city}, {formData.exporter.state}{' '}
                    {formData.exporter.postcode}
                    <br />
                    {formData.exporter.country}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box mb={1}>
                <Box display="flex" alignItems="center" mb={1}>
                  <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography variant="body2">
                      {formData.exporter.telephone}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" alignItems="center">
                  <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body2">
                      {formData.exporter.email}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Card>
      );
    }

    // Edit Mode or New Entry Mode
    return (
      <Box>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6" color="primary">
            Exporter Details
          </Typography>
          {isEditingSender && (
            <Box>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveSenderData}
                size="small"
                disabled={savingSender}
                sx={{ mr: 1 }}
              >
                {savingSender ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancelEdit}
                size="small"
                disabled={savingSender}
              >
                Cancel
              </Button>
            </Box>
          )}
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Company Name"
              value={formData.exporter.company}
              onChange={(e) =>
                handleInputChange('exporter', 'company', e.target.value)
              }
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Exporter's Reference"
              value={formData.exporter.reference}
              onChange={(e) =>
                handleInputChange('exporter', 'reference', e.target.value)
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Address Line 1"
              value={formData.exporter.address_line_1}
              onChange={(e) =>
                handleInputChange('exporter', 'address_line_1', e.target.value)
              }
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Address Line 2"
              value={formData.exporter.address_line_2}
              onChange={(e) =>
                handleInputChange('exporter', 'address_line_2', e.target.value)
              }
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="City"
              value={formData.exporter.city}
              onChange={(e) =>
                handleInputChange('exporter', 'city', e.target.value)
              }
              required
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="State/Province"
              value={formData.exporter.state}
              onChange={(e) =>
                handleInputChange('exporter', 'state', e.target.value)
              }
              required
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Postal Code"
              value={formData.exporter.postcode}
              onChange={(e) =>
                handleInputChange('exporter', 'postcode', e.target.value)
              }
              required
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Country"
              value={formData.exporter.country}
              onChange={(e) =>
                handleInputChange('exporter', 'country', e.target.value)
              }
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Contact Person"
              value={formData.exporter.contact_person}
              onChange={(e) =>
                handleInputChange('exporter', 'contact_person', e.target.value)
              }
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Telephone"
              value={formData.exporter.telephone}
              onChange={(e) =>
                handleInputChange('exporter', 'telephone', e.target.value)
              }
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.exporter.email}
              onChange={(e) =>
                handleInputChange('exporter', 'email', e.target.value)
              }
              required
            />
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Export Documents Generator
      </Typography>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          {/* Document Selection */}
          <Box mb={4}>
            <FormControl component="fieldset">
              <FormLabel component="legend">
                <Typography variant="h6" color="primary">
                  Select Documents to Generate
                </Typography>
              </FormLabel>
              <FormGroup row sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedDocuments.proforma}
                      onChange={handleDocumentSelection}
                      name="proforma"
                    />
                  }
                  label="Proforma Invoice"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedDocuments.tax}
                      onChange={handleDocumentSelection}
                      name="tax"
                    />
                  }
                  label="Tax Invoice"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedDocuments.preshipment}
                      onChange={handleDocumentSelection}
                      name="preshipment"
                    />
                  }
                  label="Preshipment Invoice"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedDocuments.packing}
                      onChange={handleDocumentSelection}
                      name="packing"
                    />
                  }
                  label="Packing List"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedDocuments.commercial}
                      onChange={handleDocumentSelection}
                      name="commercial"
                    />
                  }
                  label="Commercial Invoice"
                />
              </FormGroup>
            </FormControl>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* UID Field */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom color="primary">
              User Identification
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label="UID"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  required
                  helperText="Enter your unique identifier (UID)"
                  disabled={senderViewMode}
                  sx={{
                    '& .MuiInputBase-input': {
                      fontWeight: 'bold',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  variant="contained"
                  startIcon={
                    checkingUid ? <CircularProgress size={20} /> : <CheckIcon />
                  }
                  onClick={checkUid}
                  disabled={checkingUid || !uid || senderViewMode}
                  fullWidth
                >
                  {checkingUid ? 'Checking...' : 'Check'}
                </Button>
              </Grid>
              {senderViewMode && (
                <Grid item xs={12} md={5}>
                  <Chip
                    label="Company profile loaded"
                    color="success"
                    icon={<CheckIcon />}
                  />
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Exporter Details */}
          <Box mb={4}>{renderExporterSection()}</Box>

          {/* Invoice Details */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom color="primary">
              Invoice Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Invoice Number"
                  value={formData.invoice_details.invoice_number}
                  onChange={(e) =>
                    handleInputChange(
                      'invoice_details',
                      'invoice_number',
                      e.target.value,
                    )
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Invoice Date"
                  type="date"
                  value={formData.invoice_details.invoice_date}
                  onChange={(e) =>
                    handleInputChange(
                      'invoice_details',
                      'invoice_date',
                      e.target.value,
                    )
                  }
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Buyer's Order Number"
                  value={formData.invoice_details.buyers_order_number}
                  onChange={(e) =>
                    handleInputChange(
                      'invoice_details',
                      'buyers_order_number',
                      e.target.value,
                    )
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Buyer's Order Date"
                  type="date"
                  value={formData.invoice_details.buyers_order_date}
                  onChange={(e) =>
                    handleInputChange(
                      'invoice_details',
                      'buyers_order_date',
                      e.target.value,
                    )
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Consignee Details */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom color="primary">
              Consignee Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={formData.consignee.company}
                  onChange={(e) =>
                    handleInputChange('consignee', 'company', e.target.value)
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  value={formData.consignee.contact_person}
                  onChange={(e) =>
                    handleInputChange(
                      'consignee',
                      'contact_person',
                      e.target.value,
                    )
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Address Line 1"
                  value={formData.consignee.address_line_1}
                  onChange={(e) =>
                    handleInputChange(
                      'consignee',
                      'address_line_1',
                      e.target.value,
                    )
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Address Line 2"
                  value={formData.consignee.address_line_2}
                  onChange={(e) =>
                    handleInputChange(
                      'consignee',
                      'address_line_2',
                      e.target.value,
                    )
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="City"
                  value={formData.consignee.city}
                  onChange={(e) =>
                    handleInputChange('consignee', 'city', e.target.value)
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="State/Province"
                  value={formData.consignee.state}
                  onChange={(e) =>
                    handleInputChange('consignee', 'state', e.target.value)
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  value={formData.consignee.postcode}
                  onChange={(e) =>
                    handleInputChange('consignee', 'postcode', e.target.value)
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Country"
                  value={formData.consignee.country}
                  onChange={(e) =>
                    handleInputChange('consignee', 'country', e.target.value)
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Telephone"
                  value={formData.consignee.telephone}
                  onChange={(e) =>
                    handleInputChange('consignee', 'telephone', e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.consignee.email}
                  onChange={(e) =>
                    handleInputChange('consignee', 'email', e.target.value)
                  }
                />
              </Grid>
            </Grid>
          </Box>

          {/* Buyer Details */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom color="primary">
              Buyer Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.buyer.same_as_consignee}
                  onChange={(e) =>
                    handleInputChange(
                      'buyer',
                      'same_as_consignee',
                      e.target.checked,
                    )
                  }
                />
              }
              label="Same as Consignee"
              sx={{ mb: 2 }}
            />
            {!formData.buyer.same_as_consignee && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={formData.buyer.company}
                    onChange={(e) =>
                      handleInputChange('buyer', 'company', e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Contact Person"
                    value={formData.buyer.contact_person}
                    onChange={(e) =>
                      handleInputChange(
                        'buyer',
                        'contact_person',
                        e.target.value,
                      )
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Address Line 1"
                    value={formData.buyer.address_line_1}
                    onChange={(e) =>
                      handleInputChange(
                        'buyer',
                        'address_line_1',
                        e.target.value,
                      )
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Address Line 2"
                    value={formData.buyer.address_line_2}
                    onChange={(e) =>
                      handleInputChange(
                        'buyer',
                        'address_line_2',
                        e.target.value,
                      )
                    }
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData.buyer.city}
                    onChange={(e) =>
                      handleInputChange('buyer', 'city', e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="State/Province"
                    value={formData.buyer.state}
                    onChange={(e) =>
                      handleInputChange('buyer', 'state', e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Postal Code"
                    value={formData.buyer.postcode}
                    onChange={(e) =>
                      handleInputChange('buyer', 'postcode', e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={formData.buyer.country}
                    onChange={(e) =>
                      handleInputChange('buyer', 'country', e.target.value)
                    }
                  />
                </Grid>
              </Grid>
            )}
          </Box>

          {/* Shipping Details */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom color="primary">
              Shipping Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Pre-carriage By"
                  value={formData.shipping.pre_carriage_by}
                  onChange={(e) =>
                    handleInputChange(
                      'shipping',
                      'pre_carriage_by',
                      e.target.value,
                    )
                  }
                  placeholder="e.g., BY ROAD"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Place of Receipt"
                  value={formData.shipping.place_of_receipt}
                  onChange={(e) =>
                    handleInputChange(
                      'shipping',
                      'place_of_receipt',
                      e.target.value,
                    )
                  }
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Vessel/Flight No."
                  value={formData.shipping.vessel_flight_no}
                  onChange={(e) =>
                    handleInputChange(
                      'shipping',
                      'vessel_flight_no',
                      e.target.value,
                    )
                  }
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Port of Loading"
                  value={formData.shipping.port_of_loading}
                  onChange={(e) =>
                    handleInputChange(
                      'shipping',
                      'port_of_loading',
                      e.target.value,
                    )
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Port of Discharge"
                  value={formData.shipping.port_of_discharge}
                  onChange={(e) =>
                    handleInputChange(
                      'shipping',
                      'port_of_discharge',
                      e.target.value,
                    )
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Final Destination"
                  value={formData.shipping.final_destination}
                  onChange={(e) =>
                    handleInputChange(
                      'shipping',
                      'final_destination',
                      e.target.value,
                    )
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Country of Origin"
                  value={formData.shipping.country_of_origin}
                  onChange={(e) =>
                    handleInputChange(
                      'shipping',
                      'country_of_origin',
                      e.target.value,
                    )
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Country of Destination"
                  value={formData.shipping.country_of_destination}
                  onChange={(e) =>
                    handleInputChange(
                      'shipping',
                      'country_of_destination',
                      e.target.value,
                    )
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Container Number"
                  value={formData.shipping.container_number}
                  onChange={(e) =>
                    handleInputChange(
                      'shipping',
                      'container_number',
                      e.target.value,
                    )
                  }
                />
              </Grid>
            </Grid>
          </Box>

          {/* Terms */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom color="primary">
              Terms & Conditions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Terms of Delivery (Incoterms)"
                  value={formData.terms.delivery_terms}
                  onChange={(e) =>
                    handleInputChange('terms', 'delivery_terms', e.target.value)
                  }
                  placeholder="e.g., FOB, CIF, EXW"
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Payment Terms"
                  value={formData.terms.payment_terms}
                  onChange={(e) =>
                    handleInputChange('terms', 'payment_terms', e.target.value)
                  }
                  placeholder="e.g., 30% Advance, Balance on B/L"
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={formData.terms.currency}
                    onChange={(e) =>
                      handleInputChange('terms', 'currency', e.target.value)
                    }
                    label="Currency"
                  >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="INR">INR</MenuItem>
                    <MenuItem value="GBP">GBP</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Products Table */}
          <Box mb={4}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6" color="primary">
                Products
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addProduct}
                size="small"
              >
                Add Product
              </Button>
            </Box>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Sr. No.</TableCell>
                    <TableCell>H.S. Code</TableCell>
                    <TableCell>Marks & Nos</TableCell>
                    <TableCell>No. & Kind of Pkgs</TableCell>
                    <TableCell>Type of Packaging</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell>Rate</TableCell>
                    <TableCell>Amount</TableCell>
                    {selectedDocuments.tax && (
                      <>
                        <TableCell>Tax %</TableCell>
                        <TableCell>Tax Amt</TableCell>
                      </>
                    )}
                    <TableCell>Net Weight</TableCell>
                    <TableCell>Gross Weight</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.products.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell>{product.sr_no}</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={product.hs_code}
                          onChange={(e) =>
                            handleProductChange(
                              index,
                              'hs_code',
                              e.target.value,
                            )
                          }
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={product.marks_nos}
                          onChange={(e) =>
                            handleProductChange(
                              index,
                              'marks_nos',
                              e.target.value,
                            )
                          }
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={product.no_kind_packages}
                          onChange={(e) =>
                            handleProductChange(
                              index,
                              'no_kind_packages',
                              e.target.value,
                            )
                          }
                          sx={{ width: 100 }}
                          placeholder="100/1"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={product.type_of_packaging}
                          onChange={(e) =>
                            handleProductChange(
                              index,
                              'type_of_packaging',
                              e.target.value,
                            )
                          }
                          sx={{ width: 100 }}
                          placeholder="Rolls/Boxes"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={product.description}
                          onChange={(e) =>
                            handleProductChange(
                              index,
                              'description',
                              e.target.value,
                            )
                          }
                          required
                          sx={{ width: 200 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={product.quantity}
                          onChange={(e) =>
                            handleProductChange(
                              index,
                              'quantity',
                              e.target.value,
                            )
                          }
                          required
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          size="small"
                          value={product.unit}
                          onChange={(e) =>
                            handleProductChange(index, 'unit', e.target.value)
                          }
                          sx={{ width: 80 }}
                        >
                          <MenuItem value="PCS">PCS</MenuItem>
                          <MenuItem value="CTN">CTN</MenuItem>
                          <MenuItem value="KG">KG</MenuItem>
                          <MenuItem value="MT">MT</MenuItem>
                          <MenuItem value="ROLLS">ROLLS</MenuItem>
                          <MenuItem value="UNITS">UNITS</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={product.rate_per_unit}
                          onChange={(e) =>
                            handleProductChange(
                              index,
                              'rate_per_unit',
                              e.target.value,
                            )
                          }
                          required
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>{product.amount}</TableCell>
                      {selectedDocuments.tax && (
                        <>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={product.tax_percentage}
                              onChange={(e) =>
                                handleProductChange(
                                  index,
                                  'tax_percentage',
                                  e.target.value,
                                )
                              }
                              sx={{ width: 60 }}
                            />
                          </TableCell>
                          <TableCell>{product.tax_amount}</TableCell>
                        </>
                      )}
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={product.net_weight}
                          onChange={(e) =>
                            handleProductChange(
                              index,
                              'net_weight',
                              e.target.value,
                            )
                          }
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={product.gross_weight}
                          onChange={(e) =>
                            handleProductChange(
                              index,
                              'gross_weight',
                              e.target.value,
                            )
                          }
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => removeProduct(index)}
                          disabled={formData.products.length === 1}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Summary */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom color="primary">
              Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Total Cartons"
                  value={formData.summary.total_cartons}
                  onChange={(e) =>
                    handleInputChange(
                      'summary',
                      'total_cartons',
                      e.target.value,
                    )
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Total Net Weight"
                  value={formData.summary.total_net_weight}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Total Gross Weight"
                  value={formData.summary.total_gross_weight}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Variation % +/-"
                  value={formData.summary.variation_percentage}
                  onChange={(e) =>
                    handleInputChange(
                      'summary',
                      'variation_percentage',
                      e.target.value,
                    )
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Subtotal Amount"
                  value={formData.summary.subtotal_amount}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              {selectedDocuments.tax && (
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Total Tax Amount"
                    value={formData.summary.total_tax_amount}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              )}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Total Amount"
                  value={formData.summary.total_amount}
                  InputProps={{ readOnly: true }}
                  sx={{
                    '& .MuiInputBase-input': {
                      fontWeight: 'bold',
                      color: 'primary.main',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Amount in Words"
                  value={formData.summary.amount_in_words}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Banking Details */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom color="primary">
              Banking Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bank Name"
                  value={formData.banking.bank_name}
                  onChange={(e) =>
                    handleInputChange('banking', 'bank_name', e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Beneficiary Name"
                  value={formData.banking.beneficiary_name}
                  onChange={(e) =>
                    handleInputChange(
                      'banking',
                      'beneficiary_name',
                      e.target.value,
                    )
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bank Address"
                  multiline
                  rows={2}
                  value={formData.banking.bank_address}
                  onChange={(e) =>
                    handleInputChange('banking', 'bank_address', e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SWIFT Code"
                  value={formData.banking.swift_code}
                  onChange={(e) =>
                    handleInputChange('banking', 'swift_code', e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Account Number"
                  value={formData.banking.account_number}
                  onChange={(e) =>
                    handleInputChange(
                      'banking',
                      'account_number',
                      e.target.value,
                    )
                  }
                />
              </Grid>
            </Grid>
          </Box>

          {/* Additional Details */}
          {(selectedDocuments.preshipment || selectedDocuments.tax) && (
            <Box mb={4}>
              <Typography variant="h6" gutterBottom color="primary">
                Additional Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>IGST Status</InputLabel>
                    <Select
                      value={formData.additional.igst_status}
                      onChange={(e) =>
                        handleInputChange(
                          'additional',
                          'igst_status',
                          e.target.value,
                        )
                      }
                      label="IGST Status"
                    >
                      <MenuItem value="Paid">IGST Paid</MenuItem>
                      <MenuItem value="Not Paid">IGST Not Paid</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="LUT Number"
                    value={formData.additional.lut_number}
                    onChange={(e) =>
                      handleInputChange(
                        'additional',
                        'lut_number',
                        e.target.value,
                      )
                    }
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.additional.duty_drawback_claim}
                        onChange={(e) =>
                          handleInputChange(
                            'additional',
                            'duty_drawback_claim',
                            e.target.checked,
                          )
                        }
                      />
                    }
                    label="Duty Drawback Claim"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.additional.rodtep_claim}
                        onChange={(e) =>
                          handleInputChange(
                            'additional',
                            'rodtep_claim',
                            e.target.checked,
                          )
                        }
                      />
                    }
                    label="RODTEP Claim"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.additional.shipment_under_eut_scheme}
                        onChange={(e) =>
                          handleInputChange(
                            'additional',
                            'shipment_under_eut_scheme',
                            e.target.checked,
                          )
                        }
                      />
                    }
                    label="Shipment under EUT Scheme"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.additional.supply_under_lut}
                        onChange={(e) =>
                          handleInputChange(
                            'additional',
                            'supply_under_lut',
                            e.target.checked,
                          )
                        }
                      />
                    }
                    label="Supply under LUT"
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Declaration */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom color="primary">
              Declaration
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Declaration Text"
                  multiline
                  rows={2}
                  value={formData.declaration.text}
                  onChange={(e) =>
                    handleInputChange('declaration', 'text', e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Authorized Signatory"
                  value={formData.declaration.authorized_signatory}
                  onChange={(e) =>
                    handleInputChange(
                      'declaration',
                      'authorized_signatory',
                      e.target.value,
                    )
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.declaration.company_stamp}
                      onChange={(e) =>
                        handleInputChange(
                          'declaration',
                          'company_stamp',
                          e.target.checked,
                        )
                      }
                    />
                  }
                  label="Company Stamp Required"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Submit Button */}
          <Box display="flex" justifyContent="center" mt={4}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={
                loading || !Object.values(selectedDocuments).some((v) => v)
              }
              startIcon={
                loading ? <CircularProgress size={20} /> : <CloudUploadIcon />
              }
            >
              {loading ? 'Generating Documents...' : 'Generate Documents'}
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Generated Documents Display */}
      {generatedDocuments.length > 0 && (
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Generated Documents
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            {generatedDocuments.map((doc, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card>
                  <CardContent>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box display="flex" alignItems="center">
                        <DescriptionIcon sx={{ mr: 1 }} />
                        <Typography variant="subtitle1">{doc.type}</Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DownloadIcon />}
                        href={doc.url}
                        download
                      >
                        Download
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowSuccess(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {savingSender
            ? 'Sender data updated successfully!'
            : 'Documents generated successfully!'}
        </Alert>
      </Snackbar>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Container>
  );
};

export default MegaInvoiceForm;
