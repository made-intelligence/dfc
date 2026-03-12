import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register default font
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  header: {
    borderBottom: "2px solid #0D1F3C",
    paddingBottom: 12,
    marginBottom: 16,
  },
  orgName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0D1F3C",
    marginBottom: 2,
  },
  docTitle: {
    fontSize: 12,
    color: "#0A6E75",
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 9,
    color: "#666",
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0D1F3C",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  infoLabel: {
    width: 100,
    fontWeight: "bold",
    fontSize: 9,
    color: "#555",
  },
  infoValue: {
    flex: 1,
    fontSize: 9,
  },
  divider: {
    borderBottom: "1px solid #e5e5e5",
    marginVertical: 10,
  },
  itemContainer: {
    marginBottom: 10,
    paddingLeft: 8,
    borderLeft: "2px solid #0A6E75",
  },
  itemNumber: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#0A6E75",
    marginBottom: 2,
  },
  drugName: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 2,
  },
  drugDetail: {
    fontSize: 9,
    color: "#444",
    marginBottom: 1,
  },
  drugInstructions: {
    fontSize: 9,
    color: "#0A6E75",
    fontStyle: "italic",
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
  },
  signatureLine: {
    borderTop: "1px solid #333",
    width: 200,
    marginTop: 30,
    paddingTop: 4,
  },
  signatureName: {
    fontSize: 10,
    fontWeight: "bold",
  },
  signatureDate: {
    fontSize: 8,
    color: "#666",
    marginTop: 2,
  },
  disclaimer: {
    fontSize: 7,
    color: "#999",
    marginTop: 16,
    borderTop: "1px solid #e5e5e5",
    paddingTop: 8,
  },
});

interface PrescriptionItem {
  drugName: string;
  dose: string;
  form?: string;
  route?: string;
  frequency: string;
  duration: string;
  quantity?: string;
  instructions?: string;
}

interface PrescriptionPDFProps {
  rxNumber: string;
  date: string;
  expiresAt: string;
  patient: {
    name: string;
    dob?: string;
    bloodGroup?: string;
  };
  doctor: {
    name: string;
    specialty?: string;
    licenceNumber?: string;
    memberNumber?: string;
  };
  items: PrescriptionItem[];
  notes?: string;
}

export function PrescriptionPDF({
  rxNumber,
  date,
  expiresAt,
  patient,
  doctor,
  items,
  notes,
}: PrescriptionPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.orgName}>DOCTORS FOUNDATION FOR CARE</Text>
          <Text style={styles.docTitle}>Clinical Prescription</Text>
          <View style={styles.headerRow}>
            <Text>Rx Number: {rxNumber}</Text>
            <Text>Date: {date}</Text>
            <Text>Expires: {expiresAt}</Text>
          </View>
        </View>

        {/* Patient Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{patient.name}</Text>
          </View>
          {patient.dob && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date of Birth:</Text>
              <Text style={styles.infoValue}>{patient.dob}</Text>
            </View>
          )}
          {patient.bloodGroup && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Blood Group:</Text>
              <Text style={styles.infoValue}>{patient.bloodGroup}</Text>
            </View>
          )}
        </View>

        {/* Doctor Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prescribing Physician</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{doctor.name}</Text>
          </View>
          {doctor.specialty && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Specialty:</Text>
              <Text style={styles.infoValue}>{doctor.specialty}</Text>
            </View>
          )}
          {doctor.licenceNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Licence No:</Text>
              <Text style={styles.infoValue}>{doctor.licenceNumber}</Text>
            </View>
          )}
          {doctor.memberNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>DFC Member ID:</Text>
              <Text style={styles.infoValue}>{doctor.memberNumber}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Medications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prescribed Medications</Text>
          {items.map((item, index) => (
            <View key={index} style={styles.itemContainer}>
              <Text style={styles.itemNumber}>#{index + 1}</Text>
              <Text style={styles.drugName}>
                {item.drugName} {item.dose}
              </Text>
              {item.form && (
                <Text style={styles.drugDetail}>
                  Form: {item.form}
                  {item.route ? `  |  Route: ${item.route}` : ""}
                </Text>
              )}
              <Text style={styles.drugDetail}>
                Frequency: {item.frequency} | Duration: {item.duration}
              </Text>
              {item.quantity && (
                <Text style={styles.drugDetail}>
                  Quantity: {item.quantity}
                </Text>
              )}
              {item.instructions && (
                <Text style={styles.drugInstructions}>
                  {item.instructions}
                </Text>
              )}
            </View>
          ))}
        </View>

        {notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={{ fontSize: 9 }}>{notes}</Text>
          </View>
        )}

        {/* Signature & Footer */}
        <View style={styles.footer}>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureName}>{doctor.name}</Text>
            <Text style={styles.signatureDate}>{date}</Text>
          </View>

          <Text style={styles.disclaimer}>
            IMPORTANT: This prescription is valid for 30 days from the date
            issued. Present to any pharmacy. For queries contact
            secretariat@dfcare.org. This document was generated by the DFC
            Clinical Platform.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
