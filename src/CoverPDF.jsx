import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: '20mm',
    fontFamily: 'Times-Roman',
    backgroundColor: '#ffffff',
    color: '#000000',
    display: 'flex',
    flexDirection: 'column',
  },
  headerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 40,
    textAlign: 'center',
  },
  logo: {
    width: 110,
    marginBottom: 20,
  },
  uniName: {
    fontSize: 16,
    fontFamily: 'Times-Bold',
    textTransform: 'uppercase',
  },
  middleSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
    width: '100%',
  },
  topicLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 15,
    letterSpacing: 1,
  },
  topicTitle: {
    fontSize: 24,
    fontFamily: 'Times-Bold',
    textAlign: 'center',
    paddingLeft: 20,
    paddingRight: 20,
    marginBottom: 25,
    lineHeight: 1.3,
  },
  courseInfoBlock: {
    alignSelf: 'center', 
    display: 'flex',
    flexDirection: 'column',
    marginTop: 20,
  },
  courseRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    marginRight: 12, 
  },
  courseValue: {
    fontSize: 13,
    textAlign: 'left',
  },
  bottomSection: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 70, 
    marginBottom: 30,
  },
  column: {
    width: '45%',
  },
  colHeader: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 20,
    letterSpacing: 1,
  },
  boldText: {
    fontFamily: 'Times-Bold',
    fontSize: 14,
    marginBottom: 6,
  },
  normalText: {
    fontSize: 13,
    marginBottom: 12,
  },
  idRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center', 
    marginTop: 8,
  },
  idLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    marginRight: 12, 
  },
  idValue: {
    fontSize: 13,
    textAlign: 'left',
  },
  footer: {
    textAlign: 'center',
    marginTop: 'auto', 
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    marginRight: 10,
    letterSpacing: 1,
  },
  footerValue: {
    fontSize: 13,
  }
});

const CoverPDF = ({ formData, formattedDate }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      <View style={styles.headerContainer}>
        <Image src="/aibalogo.png" style={styles.logo} />
        <Text style={styles.uniName}>Army Institute of Business Administration, Savar</Text>
      </View>

      <View style={styles.middleSection}>
        <Text style={styles.topicLabel}>{`${formData.docType || 'Assignment'} On`}</Text>
        <Text style={styles.topicTitle}>{formData.assignmentTitle || `${formData.docType || 'Assignment'} Topic Goes Here`}</Text>
        
        <View style={styles.courseInfoBlock}>
          <View style={styles.courseRow}>
            <Text style={styles.courseLabel}>Course Title:</Text>
            <Text style={styles.courseValue}>{formData.courseTitle}</Text>
          </View>
          <View style={styles.courseRow}>
            <Text style={styles.courseLabel}>Course Code:</Text>
            <Text style={styles.courseValue}>{formData.courseCode}</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.column}>
          <Text style={styles.colHeader}>Submitted To:</Text>
          <Text style={styles.boldText}>{formData.instructorName}</Text>
          <Text style={styles.normalText}>{formData.designation}</Text>
        </View>
        
        <View style={styles.column}>
          <Text style={styles.colHeader}>Submitted By:</Text>
          <Text style={styles.boldText}>{formData.fullName}</Text>
          <View style={styles.idRow}>
            <Text style={styles.idLabel}>ID:</Text>
            <Text style={styles.idValue}>{formData.studentId}</Text>
          </View>
          <View style={styles.idRow}>
            <Text style={styles.idLabel}>BATCH:</Text>
            <Text style={styles.idValue}>{formData.batch}</Text>
          </View>
          {formData.section && (
            <View style={styles.idRow}>
              <Text style={styles.idLabel}>SECTION:</Text>
              <Text style={styles.idValue}>{formData.section}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Date of Submission:</Text>
        <Text style={styles.footerValue}>{formattedDate}</Text>
      </View>

    </Page>
  </Document>
);

export default CoverPDF;