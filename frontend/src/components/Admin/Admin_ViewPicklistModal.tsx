import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Box,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Button,
  CircularProgress,
} from "@mui/material";
import adminApiService from "../../services/adminApiService";
import { Tabs, Tab } from "@mui/material";

import { generatePicklistEmailHtml } from "../../assets/templates/generatePicklistEmailHtml"; // Default Import
import { generateReturnlistEmailHtml } from "../../assets/templates/generateReturnlistEmailHtml"; // Default Import
import { generateOrderDetailsEmailHtml } from "../../assets/templates/generateOrderDetailsEmailHtml"; // Default Import
import { renderToStaticMarkup } from "react-dom/server";
import latestOrderServices from "./AdminServices/latestOrderServices";

import { generatePdfFromElement, blobToBase64 } from "../../utils/tourHelper";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../../store/useNotificationStore";

const modalStyle = {
  overflow: "auto",
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  // width: '600px',
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: "8px",
  height: "90vh",
  fontFamily: "Raleway",
};

// Email Signature HTML
const emailSignatureHtml = `
  <div class="rd-mail-signature" style="font-family:Helvetica,Arial,Calibri,Sans-Serif;font-size:12px;margin:0;padding:0">
    <table class="rd-top-info" style="font-size:12px;border-spacing:0;">
      <tbody>
        <tr>
          <td>--</td>
        </tr>
        <tr>
          <td style="font-size:12px;line-height:10px;padding-bottom:5px">Mit freundlichen Grüßen / Best Regards</td>
        </tr>
      </tbody>
    </table>
    <table class="rd-top-info" style="font-size:12px;border-spacing:0;">
      <tbody>
        <tr>
          <td style="font-size:12px;line-height:10px;padding-bottom:5px;"><span class="rd-name" style="font-size:12px;font-weight:700;padding-bottom:5px;border-bottom: 2px solid #f69328;"></span></td>
        </tr>
      </tbody>
    </table>

    <table style="font-size:12px;border-spacing:0">
      <tbody>
        <tr>
          <td><span class="rd-mail"><img src="https://vendomnia.com/media/image/71/fb/86/envelope_gr.png"><a href="mailto:service@vendomnia.com"> service@vendomnia.com</a></span></td>
        </tr>
        <tr>
          <td><span class="rd-mail"><img src="https://vendomnia.com/media/image/71/fb/86/envelope_gr.png"><a href="mailto:service@sunniva-solar.de"> service@sunniva-solar.de</a></span></td>
        </tr>
        <tr>
          <td><img src="https://vendomnia.com/media/image/73/69/be/web_gr.png"><a href="https://www.vendomnia.com"> www.vendomnia.com</a></td>
        </tr>
        <tr>
          <td><img src="https://vendomnia.com/media/image/73/69/be/web_gr.png"><a href="www.sunniva-solar.de"> www.sunniva-solar.de</a></td>
        </tr>
      </tbody>
    </table>
    <br>
    <br>
    <img src="https://vendomnia.com/media/image/c2/56/da/sunniva_logo.png" alt="Sunniva GmbH">
    <br><br>
    
    <table style="font-size:12px;border-spacing:0">
      <tbody>
        <tr>
          <td style="font-weight:600;">
            <img src="https://ci3.googleusercontent.com/meips/ADKq_NYZMr0zl4BJs1uV6wY5e_10bQFWLOAsKAceTqqPJhmtct11GRnjm4s8dzR-Fv1E6h0wMauk7zpp72PBCmpRJtKuJgGWaWQMrA=s0-d-e1-ft#https://www.vendomnia.rs/images/ger_flag_small.png"> Sunniva GmbH
          </td>
        </tr>
        <tr>
          <td> Honer Straße 49</td>
        </tr>
        <tr>
          <td> 37269 Eschwege</td>
        </tr>
        <tr>
          <td> Germany</td>
        </tr>
      </tbody>
    </table>
    <br><br>
    <table style="font-size:12px;border-spacing:0;border-bottom: 2px solid #f69328;">
      <tbody>
        <tr>
          <td>VAT Identification Number: DE328448044</td>
        </tr>
        <tr>
          <td>Commercial Register Number: HRB 206120</td>
        </tr>
        <tr>
          <td>Amtsgericht Göttingen</td>
        </tr>
        <tr>
          <td>VerpackG Register Nummer: DE1381538064420</td>
        </tr>
        <tr>
          <td>ElektroG WEEE Register Nummer: DE53396155</td>
        </tr>
        <tr>
          <td>BATTG Register Nummer: DE62881384</td>
        </tr>
      </tbody>
    </table>
  </div>
`;

interface OrderItem {
  slmdl_articleordernumber: string;
  quantity: number;
}

interface Order {
  order_number: string;
  items: OrderItem[];
}

export interface Driver {
  address: string;
  driver_id: number;
  driver_name: string;
  mobile: string;
}

export interface PicklistData {
  driver: Driver;
  orders: Order[];
}

interface ViewPicklistModalProps {
  open: boolean;
  tourId: number | null;
  handleClose: () => void;
  onSendEmail: (success: boolean) => void; // <-- updated here
}

const ViewPicklistModal = ({
  open,
  handleClose,
  tourId,
  onSendEmail,
}: ViewPicklistModalProps) => {
  const { showNotification } = useNotificationStore();
  const [picklistData, setPicklistData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [Btnloading, setBtnloading] = useState(false);
  // const [selectedTour, setSelectedTour] = useState<any | null>(null);

  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    if (!tourId) return;
    if (open && tourId) {
      fetchPicklistData(tourId);
    }
  }, [open, tourId]);

  const fetchPicklistData = useCallback(async (tourId: number) => {
    if (!tourId) return;
    setLoading(true);

    try {
      const instance = latestOrderServices.getInstance();
      const toursdata = await instance.getTours();
      const matchedTour = toursdata.find(
        (tour: any) => tour.id === Number(tourId),
      );
      if (matchedTour) {
        setPicklistData(matchedTour);
      } else {
        console.error("Tour not found");
        showNotification({
          message: "Tour not found",
          severity: NotificationSeverity.Warning,
        });
      }
    } catch (error) {
      console.error("Error fetching picklist data:", error);
      showNotification({
        message: `Error fetching picklist data`,
        severity: NotificationSeverity.Error,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSendEmail = async () => {
    if (!picklistData) return;

    const picklistDocHtml = generatePicklistEmailHtml(
      picklistData,
      aggregatedItems,
      totalQuantity,
    );
    const returnDocHtml = generateReturnlistEmailHtml(
      picklistData,
      aggregatedItems,
      totalQuantity,
    );
    const orderDetailsHtml = generateOrderDetailsEmailHtml(picklistData);

    let fullEmailHtml =
      "Dear,<br><br> Please find attached Picklist for your reference." +
      emailSignatureHtml;
    fullEmailHtml = orderDetailsHtml + emailSignatureHtml;

    setBtnloading(true);

    try {
      // 🔁 1. Create a hidden container
      let element = document.createElement("div");
      element.innerHTML = picklistDocHtml;
      element.style.position = "absolute";
      element.style.left = "-9999px";
      element.style.top = "0";
      element.style.width = "800px"; // match your content width
      element.style.backgroundColor = "white"; // avoid transparency issues
      document.body.appendChild(element);

      let config = {
        orientation: "p", // Potrait orientation
        unit: "mm", // Points as the unit
        format: "a4", // A4 size format
      };

      let pdfBlob = await generatePdfFromElement(element, config);

      let attachment = await blobToBase64(pdfBlob); // use FileReader
      let attachment_name = "picklist.pdf"; // use FileReader
      // Wait a bit in case it's just rendered

      // 🔁 1. Create a hidden container
      element = document.createElement("div");
      element.innerHTML = orderDetailsHtml;
      element.style.position = "absolute";
      element.style.left = "-9999px";
      element.style.top = "0";
      element.style.width = "60%"; // match your content width
      element.style.backgroundColor = "white"; // avoid transparency issues
      document.body.appendChild(element);

      config = {
        orientation: "landscape", // Landscape orientation
        unit: "pt", // Points as the unit
        format: "a4", // A4 size format
      };

      pdfBlob = await generatePdfFromElement(element, config);

      let second_attachment = await blobToBase64(pdfBlob); // use FileReader
      let second_attachment_name = "order-details.pdf"; // use FileReader
      // Wait a bit in case it's just rendered

      // 🔁 1. Create a hidden container
      element = document.createElement("div");
      element.innerHTML = returnDocHtml;
      element.style.position = "absolute";
      element.style.left = "-9999px";
      element.style.top = "0";
      element.style.width = "800px"; // match your content width
      element.style.backgroundColor = "white"; // avoid transparency issues
      document.body.appendChild(element);

      config = {
        orientation: "p", // Potrait orientation
        unit: "mm", // Points as the unit
        format: "a4", // A4 size format
      };

      pdfBlob = await generatePdfFromElement(element, config);

      let third_attachment = await blobToBase64(pdfBlob); // use FileReader
      let third_attachment_name = "return-list.pdf"; // use FileReader
      // Wait a bit in case it's just rendered

      await adminApiService.sendEmail({
        to: "raja.zainulabadin@vendomnia.com", // Update with actual email
        subject: "Picklist Documents",
        html: fullEmailHtml,
        attachment,
        attachment_name,
        second_attachment,
        second_attachment_name,
        third_attachment,
        third_attachment_name,
      });

      // On success
      onSendEmail(true);
    } catch (error) {
      // On error
      onSendEmail(false);

      console.error("Failed to send email", error);
    } finally {
      setBtnloading(false);
    }
  };

  // Helper: Merge logic
  const getMergedOrderItems = (orders: Order[]) => {
    const mergedMap = new Map<
      string,
      {
        order_number: string;
        slmdl_articleordernumber: string;
        quantity: number;
      }
    >();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const key = `${order.order_number}-${item.slmdl_articleordernumber}`;
        if (mergedMap.has(key)) {
          mergedMap.get(key)!.quantity += item.quantity;
        } else {
          mergedMap.set(key, {
            order_number: order.order_number,
            slmdl_articleordernumber: item.slmdl_articleordernumber,
            quantity: item.quantity,
          });
        }
      });
    });

    return Array.from(mergedMap.values());
  };
  // Aggregate items by article number
  const aggregatedItems: { [key: string]: number } = {};
  let totalQuantity = 0;

  let zips = (() => {
    const uniqueZips = picklistData?.orders
      ?.map((order: { zipcode: string }) => order.zipcode)
      .filter(
        (zip: string, index: number, self: string[]) =>
          zip && self.indexOf(zip) === index,
      );

    if (!uniqueZips || uniqueZips.length === 0) return " N/A";

    return uniqueZips.length === 1
      ? ` ${uniqueZips[0]}`
      : ` ${uniqueZips.map((zip: string) => zip.slice(-2)).join(", ")}`;
  })();

  if (picklistData) {
    picklistData.orders.forEach((order: { items: any[] }) => {
      order.items.forEach((item) => {
        const key = item.slmdl_articleordernumber;
        aggregatedItems[key] = (aggregatedItems[key] || 0) + item.quantity;
        totalQuantity += item.quantity;
      });
    });
  }

  if (loading) {
    return (
      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Typography variant="h6" mb={2}>
            Loading picklist...
          </Typography>
        </Box>
      </Modal>
    );
  }

  if (!picklistData) {
    return (
      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Typography variant="h6" mb={2}>
            No picklist data available.
          </Typography>
        </Box>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <Box>
        <Grid container spacing={2}>
          <Box sx={modalStyle}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              centered
              sx={{ mb: 3 }}
            >
              <Tab label="Picklist" />
              <Tab label="Order Details" />
            </Tabs>

            {/* PICKLIST TAB */}
            {activeTab === 0 && (
              <Box id="pdf-content-picklist">
                <Box sx={{ textAlign: "center", mb: "25px" }}>
                  <img
                    src={`https://sunniva-solar.de/wp-content/uploads/2025/01/Sunniva_1600x500_transparent-min.png`}
                    alt="Sunniva Logo"
                    style={{ height: "52px" }}
                  />
                </Box>

                <Paper sx={{ p: 1, boxShadow: "none" }}>
                  {/* Title */}
                  <Typography
                    variant="h6"
                    sx={{
                      textAlign: "center",
                      color: "#000",
                      fontSize: "14px",
                      textDecoration: "underline",
                      fontWeight: "bold",
                      mb: 2,
                      fontFamily: "Raleway",
                    }}
                  >
                    PICK LIST
                  </Typography>

                  {/* Warehouse & Driver Details */}
                  <Box
                    sx={{
                      fontFamily: "Raleway",
                      color: "#000",
                      fontSize: "13px",
                      width: "430px",
                      lineHeight: 1.1,
                    }}
                  >
                    <p>
                      <strong>
                        Location&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:
                      </strong>{" "}
                      {picklistData?.warehouseName ?? "N/A"} <br />
                      <strong>
                        Driver&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:
                      </strong>{" "}
                      {picklistData?.driver?.driver_name ?? "N/A"} <br />
                      <strong>Licence plate&nbsp;&nbsp;&nbsp;:</strong>{" "}
                      {picklistData?.driver?.licenceplate ?? "N/A"} <br />
                      <strong>
                        Email&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:
                      </strong>{" "}
                      {picklistData?.driver?.email ?? "N/A"} <br />
                      <strong>
                        Phone&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:
                      </strong>{" "}
                      {picklistData?.driver?.mobile ?? "N/A"} <br />
                      <strong>
                        ZIP
                        Code&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:
                      </strong>
                      {zips} <br />
                      <strong>
                        Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:
                      </strong>
                      {picklistData?.tour_date
                        ? (() => {
                            const dates = picklistData.tour_date.split(",");
                            return dates
                              .map((day: string, index: number) =>
                                index === 0
                                  ? ` ${new Date(day).toLocaleDateString("en-GB")}`
                                  : `\n                     ${new Date(day).toLocaleDateString("en-GB")}`,
                              )
                              .join("\n");
                          })()
                        : " N/A"}
                    </p>
                  </Box>
                </Paper>

                {/*<Typography variant="h6" mb={2} sx={{ color: '#ef972e' }}>Order item details</Typography>*/}

                {/* Orders Table */}

                {/* Aggregated Table */}
                {/*<Typography variant="h6" mb={2} mt={3} sx={{ color: '#ef972e' }}>Total pickup items</Typography>*/}
                <TableContainer
                  component={Paper}
                  sx={{
                    width: "89%",
                    marginLeft: "11%",
                    boxShadow: "none", // Remove Paper shadow
                    fontFamily: "Raleway, sans-serif",
                    borderRadius: "0px",
                  }}
                >
                  <Table
                    sx={{
                      borderCollapse: "collapse",
                      fontSize: "14px",
                    }}
                  >
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f79c22" }}>
                        <TableCell
                          align="center"
                          sx={{
                            border: "1.5px solid #000",
                            padding: "14px 20px 2px",
                            color: "white",
                            fontWeight: "bold",
                          }}
                        >
                          ITEM
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            border: "1.5px solid #000",
                            padding: "14px 20px 2px",
                            color: "white",
                            fontWeight: "bold",
                          }}
                        >
                          QUANTITY
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            border: "1.5px solid #000",
                            padding: "14px 20px 2px",
                            color: "white",
                            fontWeight: "bold",
                          }}
                        >
                          CHECK
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(aggregatedItems).map(
                        ([articleNumber, qty], index) => (
                          <TableRow key={index}>
                            <TableCell
                              align="center"
                              sx={{
                                border: "1.5px solid #000",
                                padding: "29px 8px",
                                fontFamily: "Raleway, sans-serif",
                              }}
                            >
                              {articleNumber}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                border: "1.5px solid #000",
                                padding: "29px 8px",
                                fontFamily: "Raleway, sans-serif",
                              }}
                            >
                              {qty}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                border: "1.5px solid #000",
                                padding: "29px 8px",
                                fontFamily: "Raleway, sans-serif",
                              }}
                            ></TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* ORDER DETAILS TAB */}
            {activeTab === 1 && (
              <Box sx={{ overflowX: "auto" }}>
                {/* <Typography
                variant="h6"
                sx={{
                  textAlign: 'center',
                  textDecoration: 'underline',
                  fontWeight: 'bold',
                  mb: 2,
                  fontFamily: 'Arial, sans-serif;',
                }}
              >
                ORDER DETAILS
              </Typography>
            */}
                {/* Scrollable Table */}
                <Box
                  id="order-details-table"
                  sx={{ minWidth: "1000px", fontFamily: "Arial, sans-serif;" }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      textAlign: "left",
                      fontWeight: "bold",
                      fontFamily: "Arial, sans-serif;",
                      fontSize: "18.5px;",
                    }}
                  >
                    {picklistData?.tour_name}
                  </Typography>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "14px",
                    }}
                  >
                    <thead>
                      <tr
                        style={{ backgroundColor: "#ef972e", color: "white" }}
                      >
                        {[
                          "Position in Tour",
                          "Straße",
                          "Ansprechpartner Telefonnummer",
                          "Postleitzahl",
                          "Stadt",
                          "Notiz",
                          "Referenz",
                          "Menge",
                        ].map((col) => (
                          <th
                            key={col}
                            style={{
                              border: "1px solid #ccc",
                              padding: "8px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {picklistData?.orders?.map(
                        (order: any, index: number) => {
                          // Extract item numbers and quantity sum from order.items
                          const itemNumbers =
                            order.items
                              ?.map(
                                (item: any) => item.slmdl_articleordernumber,
                              )
                              .join(", ") || "";
                          const totalQuantity =
                            order.items?.reduce(
                              (sum: number, item: any) =>
                                sum + (item.quantity || 0),
                              0,
                            ) || 0;

                          const isEmpty = ![
                            index,
                            order?.street,
                            order?.phone,
                            order?.zipcode,
                            order?.city,
                            order?.note,
                            order?.order_number,
                            order?.quantity,
                          ].some((val) => val && val.toString().trim() !== "");

                          if (isEmpty) return null;

                          return (
                            <tr key={index}>
                              <td
                                style={{
                                  border: "1px solid #ccc",
                                  padding: "8px",
                                }}
                              >
                                {index + 1}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #ccc",
                                  padding: "8px",
                                }}
                              >
                                {order.street ?? ""}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #ccc",
                                  padding: "8px",
                                }}
                              >
                                {order.phone ?? ""}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #ccc",
                                  padding: "8px",
                                }}
                              >
                                {order.zipcode ?? ""}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #ccc",
                                  padding: "8px",
                                }}
                              >
                                {order.city ?? ""}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #ccc",
                                  padding: "8px",
                                }}
                              >
                                {itemNumbers ?? ""}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #ccc",
                                  padding: "8px",
                                }}
                              >
                                {order.order_number ?? ""}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #ccc",
                                  padding: "8px",
                                }}
                              >
                                {totalQuantity ?? ""}
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </Box>
              </Box>
            )}
            {/* Email Button */}
            <Box mt={3} textAlign="center">
              <Button
                variant="contained"
                color="primary"
                onClick={handleSendEmail}
                disabled={Btnloading}
                startIcon={
                  Btnloading && <CircularProgress size={20} color="inherit" />
                }
              >
                {Btnloading ? "Sending..." : "Send Email"}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Box>
    </Modal>
  );
};

export default ViewPicklistModal;
