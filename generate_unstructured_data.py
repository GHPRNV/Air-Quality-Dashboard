"""
generate_unstructured_data.py
==============================
Generates authentic Unstructured Big Data for the AirScope Environmental Intelligence project:
1. unstructured_iot_sensor_stream.log: Raw IoT station syslog streams (machine events, laser diagnostics, error codes, unstructured text, sensor payloads)
2. unstructured_environmental_bulletins.json: Full-text official CPCB, IMD, CAQM, and WHO environmental bulletins and public health advisories
3. unstructured_citizen_incidents.log: Citizen complaint reports & field inspection logs with free-form narrative text
"""

import os
import json
import random
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CITIES = [
    {"name": "Delhi", "prefix": "DEL", "stations": ["AnandVihar", "PunjabiBagh", "RKPuram", "OkhlaPhase3", "IAPGI"]},
    {"name": "Mumbai", "prefix": "BOM", "stations": ["BandraKurla", "Colaba", "BorivaliEast", "Worli", "VileParle"]},
    {"name": "Bengaluru", "prefix": "BLR", "stations": ["BTMlayout", "PeenyaInd", "Whitefield", "Hebbal", "SilkBoard"]},
    {"name": "Kolkata", "prefix": "CCU", "stations": ["VictoriaMem", "Jadavpur", "RabindraSarobar", "SaltLakeSecV", "HowrahBridge"]},
    {"name": "Chennai", "prefix": "MAA", "stations": ["ManaliInd", "Velachery", "Alandur", "Adyar", "Kodungaiyur"]},
    {"name": "Hyderabad", "prefix": "HYD", "stations": ["Sanathnagar", "Bollaram", "Gachibowli", "ZooPark", "Charminar"]},
    {"name": "Ahmedabad", "prefix": "AMD", "stations": ["Maninagar", "VatvaInd", "Bopal", "Sabarmati", "Narol"]},
    {"name": "Pune", "prefix": "PNQ", "stations": ["Shivajinagar", "Hadapsar", "Katraj", "BhosariInd", "Kothrud"]},
    {"name": "Jaipur", "prefix": "JAI", "stations": ["AdarshNagar", "SitapuraInd", "Mansarovar", "ShastriNagar", "AjmerRoad"]},
    {"name": "Lucknow", "prefix": "LKO", "stations": ["Lalbagh", "TalkatoraInd", "Aliganj", "GomtiNagar", "Charbagh"]}
]

LOG_TEMPLATES = [
    (
        "INFO",
        "Routine optical particle counter (OPC-N3) telemetry acquired. Flow rate: {flow:.2f} L/min, laser_mA: {laser:.1f}. PM2.5={pm25:.1f} ug/m3, PM10={pm10:.1f} ug/m3, NO2={no2:.1f} ppb, SO2={so2:.1f} ppb, CO={co:.2f} ppm. Ambient T={temp:.1f}C, RH={rh:.1f}%, Wind={ws:.1f}km/h. CRC16 checksum verified 0x{crc:04X}."
    ),
    (
        "INFO",
        "Sensirion SPS30 laser scattering cycle complete. Raw particle bins: bin_0_3={bin03}, bin_0_5={bin05}, bin_1_0={bin10}, bin_2_5={bin25}. Calculated mass concentration: PM2.5={pm25:.1f} ug/m3. Photodiode voltage: {volt:.3f}V. Power bus stable at {bus_v:.2f}V."
    ),
    (
        "WARN",
        "High relative humidity ({rh:.1f}%) triggering hygroscopic aerosol growth compensation algorithm. Heated inlet dehumidifier duty cycle engaged at {duty}%. Raw uncompensated PM2.5={raw_pm:.1f} adjusted down to {pm25:.1f} ug/m3 using Kohler particle growth curve."
    ),
    (
        "WARN",
        "Optical sensor lens attenuation detected at {atten:.1f}%. Baseline photodiode calibration drift: +{drift:.2f} mV. Purge fan pulse initiated (burst_dur={purge}ms). Diagnostic code: W-OPC-LENS-DIRT. Operator inspection recommended if attenuation exceeds 35%."
    ),
    (
        "WARN",
        "Transient pollutant concentration surge detected. Delta PM2.5 = +{delta:.1f} ug/m3 over 180s rolling window. Localized emission source suspected (combustion / traffic congestion / open burning). Correlation with CO (+{co_delta:.2f} ppm) indicates biomass or vehicular plume."
    ),
    (
        "CRIT",
        "HAZARDOUS CONCENTRATION ALERT: Ambient PM2.5={pm25:.1f} ug/m3, PM10={pm10:.1f} ug/m3 exceeds CPCB 24-hr Severe Threshold (PM2.5 > 250 ug/m3). Atmospheric boundary layer height compressed to {inv}m under severe thermal inversion. Automated alert packet dispatched to municipal emergency control hub."
    ),
    (
        "CRIT",
        "ELECTROCHEMICAL SENSOR CROSS-SENSITIVITY FAULT: High ambient NO2 ({no2:.1f} ppb) and O3 ({o3:.1f} ppb) causing electrode polarization. Zero-drift compensation exceeded safety tolerance. Status: SENSOR_DEGRADED. Telemetry flagged with veracity caveat code E-POL-409."
    ),
    (
        "DEBUG",
        "Internal hardware health check: station_uptime={uptime}s, ram_free={ram_free}kB, flash_cycles={flash}, psu_temp={psu_temp:.1f}C. Solar charge controller MPPT efficiency: {mppt:.1f}%. Network RSSI: -{rssi} dBm via 4G LTE-M modem."
    )
]

BULLETINS = [
    {
        "bulletin_id": "CPCB-2024-DEL-GRAP-IV",
        "source": "Central Pollution Control Board (CPCB) & CAQM",
        "date": "2024-11-04",
        "region": "Delhi-NCR (National Capital Region)",
        "alert_level": "EMERGENCY (GRAP Stage-IV)",
        "summary": "Invocation of Stage-IV of Graded Response Action Plan (GRAP) due to Severe+ Air Quality",
        "full_text": (
            "In view of the prevailing meteorological conditions, characterized by low wind speeds (under 4 km/h), "
            "shallow boundary layer (mixing depth below 200 meters), and significant stubble burning smoke plume advection "
            "from north-western agrarian belts, the Sub-Committee on GRAP hereby invokes all actions envisaged under "
            "Stage-IV ('Severe+' Air Quality, AQI > 450) with immediate effect across the entire National Capital Region. "
            "\nKey Directives:\n"
            "1. Ban on entry of non-BS-VI diesel light commercial vehicles (LCVs) into Delhi.\n"
            "2. Complete prohibition on diesel medium and heavy goods vehicles (MGVs/HGVs) except those carrying essential commodities.\n"
            "3. Complete cessation of construction and demolition activities for public projects including highways, flyovers, and power transmission lines.\n"
            "4. NCR State Governments and GNCTD are strongly advised to switch all primary, middle, and secondary schools to virtual online classes.\n"
            "5. Public Health Warning: Vulnerable citizens, especially children, the elderly, and individuals with cardiovascular, respiratory, "
            "or pulmonary ailments, are strongly advised to stay indoors and avoid any outdoor physical exertion. N95/FFP2 respirators are mandatory for essential outdoor exposure."
        ),
        "tags": ["GRAP-IV", "Emergency", "Delhi", "Stubble Burning", "Health Advisory", "Severe+"]
    },
    {
        "bulletin_id": "IMD-2024-AIR-MET-11",
        "source": "India Meteorological Department (IMD) - Atmospheric Dispersion Division",
        "date": "2024-12-18",
        "region": "Indo-Gangetic Plain (Punjab, Haryana, Delhi, Uttar Pradesh, Bihar)",
        "alert_level": "METEOROLOGICAL INVERSION WATCH",
        "summary": "Dense Fog, Radiation Inversion, and Stagnant Ventilation Index across Northern Plains",
        "full_text": (
            "Special Atmospheric Dispersion and Air Quality Bulletin:\n"
            "Synoptic observation confirms the development of an extensive anticyclonic circulation over north-western India, "
            "resulting in a persistent ground-based temperature inversion between 00:00 and 10:00 IST. "
            "Mixing heights are anticipated to remain restricted between 120m and 350m during morning hours, severely limiting vertical "
            "dispersion of surface pollutants. The ventilation index is projected to plummet below 1,500 m2/s (a threshold indicative of "
            "extreme pollution accumulation). Surface calm conditions (wind speed < 3 knots) will exacerbate the trapping of vehicular exhaust, "
            "industrial emissions, and domestic solid fuel combustion particles. Dense fog layers will trigger secondary inorganic aerosol formation "
            "through aqueous-phase oxidation of SO2 into sulfate and NO2 into particulate nitrate."
        ),
        "tags": ["IMD", "Meteorology", "Inversion", "Ventilation Index", "Dense Fog", "Secondary Aerosols"]
    },
    {
        "bulletin_id": "MPCB-2024-BOM-COASTAL-02",
        "source": "Maharashtra Pollution Control Board (MPCB)",
        "date": "2024-03-22",
        "region": "Mumbai Metropolitan Region (MMR)",
        "alert_level": "MODERATE TO POOR WARNING",
        "summary": "Dust Dispersion from Infrastructure Megaprojects and Sea-Breeze Reversal",
        "full_text": (
            "Environmental Compliance and Ambient Air Monitoring Bulletin:\n"
            "Continuous Ambient Air Quality Monitoring Stations (CAAQMS) at Bandra-Kurla Complex (BKC), Worli, and Colaba "
            "have registered sustained PM10 excursions exceeding 180 ug/m3. The primary emission driver is identified as unmitigated "
            "fugitive road dust and excavation debris from ongoing metro rail tunneling and coastal road construction corridors. "
            "The diurnal sea-breeze onset has experienced delay, trapping coastal particulate matter over the peninsula during peak evening traffic hours. "
            "\nMandatory Compliance Measures:\n"
            "- Continuous water mist cannons and mechanical sweeping must be deployed on all major arterial transit corridors.\n"
            "- 35-foot perimeter acoustic and dust barriers must be maintained around all urban construction plots.\n"
            "- Ready-mix concrete (RMC) batching plants must operate enclosed bag-filter systems under pain of immediate power disconnection."
        ),
        "tags": ["Mumbai", "MPCB", "PM10", "Fugitive Dust", "Construction", "Coastal Air"]
    },
    {
        "bulletin_id": "KSPCB-2024-BLR-TRAFFIC-08",
        "source": "Karnataka State Pollution Control Board (KSPCB)",
        "date": "2024-06-14",
        "region": "Bengaluru Urban (Silk Board, Peenya, Whitefield)",
        "alert_level": "SATISFACTORY TO MODERATE POST-MONSOON NOTICE",
        "summary": "Pre-Monsoon Shower Cleansing Effect Followed by Traffic Corridor Resuspension",
        "full_text": (
            "Urban Air Quality Telemetry Bulletin:\n"
            "Pre-monsoon convective thunderstorms over Bengaluru have yielded a substantial scavenging effect, with city-wide "
            "24-hour mean PM2.5 dropping to 28.4 ug/m3 ('Good' CPCB category). However, heavy vehicular idling at congested traffic bottlenecks "
            "(notably Central Silk Board, Tin Factory, and Outer Ring Road Whitefield) continues to generate elevated localized NO2 concentrations "
            "reaching 68.2 ppb during 17:00-21:00 peak hours. Citizen exposure in open transit vehicles remains elevated. "
            "KSPCB urges transit authorities to optimize signal synchronizations and encourages public transit adoption to curtail nitrogen oxide surges."
        ),
        "tags": ["Bengaluru", "KSPCB", "Monsoon Washout", "NO2", "Traffic Congestion", "Silk Board"]
    },
    {
        "bulletin_id": "WHO-2024-GLOBAL-AIR-ADVISORY",
        "source": "World Health Organization (WHO) Regional Office for South-East Asia",
        "date": "2024-09-10",
        "region": "South-East Asia Urban Centers",
        "alert_level": "GLOBAL PUBLIC HEALTH ADVISORY",
        "summary": "Health Risks of Fine Particulate Matter (PM2.5) Long-Term Exposure",
        "full_text": (
            "Public Health Scientific Advisory:\n"
            "In accordance with the 2021 WHO Global Air Quality Guidelines (AQGs), particulate matter smaller than 2.5 microns (PM2.5) "
            "represents the single most critical environmental risk factor for premature mortality, ischemic heart disease, stroke, "
            "chronic obstructive pulmonary disease (COPD), and lower respiratory infections. "
            "The guideline recommends an annual mean limit of 5 ug/m3 and 24-hour limit of 15 ug/m3. "
            "Member state urban municipalities are strongly advised to accelerate continuous real-time telemetry deployment, transition to "
            "clean public transit fleets, enforce stringent industrial emission ceilings, and implement community air quality alert dashboards "
            "to minimize preventable environmental morbidity."
        ),
        "tags": ["WHO", "Public Health", "PM2.5", "Epidemiology", "Global Standards", "Respiratory Health"]
    }
]

CITIZEN_INCIDENTS = [
    {
        "incident_id": "INC-2024-DEL-8921",
        "timestamp": "2024-11-04 21:14:02",
        "city": "Delhi",
        "location": "Mayapuri Industrial Area, Phase II",
        "reported_by": "Citizen Air Patrol Mobile App",
        "severity": "CRITICAL",
        "category": "Illegal Industrial Emission",
        "narrative": (
            "Pungent acrid chemical smoke observed venting from unauthorized metal recycling furnace after 20:00 hrs. "
            "Dense black plume visible from Ring Road flyover. Visible irritant causing eye burning and throat coughing among pedestrians. "
            "Local ambient sensor node DEL-MAYAPURI registered PM2.5 surge from 140 to 420 ug/m3 within 30 minutes."
        ),
        "status": "DISPATCHED_TO_FIELD_TEAM"
    },
    {
        "incident_id": "INC-2024-DEL-9014",
        "timestamp": "2024-11-05 06:45:11",
        "city": "Delhi",
        "location": "Bhalswa Landfill Perimeter, North Delhi",
        "reported_by": "Municipal Drone Surveillance Squad",
        "severity": "HIGH",
        "category": "Open Waste Combustion",
        "narrative": (
            "Smoldering subsurface methane fire detected across section 4B of Bhalswa dump site. "
            "Uncontrolled organic and plastic refuse combustion spreading foul smoke across GT Karnal road corridor. "
            "Fire tender deployed with high-pressure foam suppression. AirScope telemetry station flagged extreme VOC and CO spikes."
        ),
        "status": "CONTAINMENT_IN_PROGRESS"
    },
    {
        "incident_id": "INC-2024-BOM-4412",
        "timestamp": "2024-03-22 15:30:22",
        "city": "Mumbai",
        "location": "SCLR Kurla Junction, MMR",
        "reported_by": "Traffic Police Ward Officer",
        "severity": "MEDIUM",
        "category": "Unpaved Construction Dust",
        "narrative": (
            "Heavy tipper trucks hauling dry earth from flyover excavation without mandatory tarpaulin covers. "
            "Massive fugitive dust vortex generated by passing commercial vehicles, reducing motorist visibility to under 100 meters. "
            "Contractor issued show-cause notice and fined Rs. 50,000 under BMC Clean Air Guidelines."
        ),
        "status": "FINE_ISSUED"
    },
    {
        "incident_id": "INC-2024-BLR-2109",
        "timestamp": "2024-06-14 18:22:04",
        "city": "Bengaluru",
        "location": "Bellandur Eco-Space Outer Ring Road",
        "reported_by": "Resident Welfare Association (RWA)",
        "severity": "MEDIUM",
        "category": "Biomass & Foliage Burning",
        "narrative": (
            "Commercial complex maintenance staff burning dry leaves and horticultural clippings along stormwater drain boundary. "
            "Dense white smoke drifting directly into residential apartment blocks. Security guard instructed to extinguish immediately with hose."
        ),
        "status": "RESOLVED_ON_SITE"
    },
    {
        "incident_id": "INC-2024-CCU-5501",
        "timestamp": "2024-01-12 08:10:45",
        "city": "Kolkata",
        "location": "Strand Road, Near Howrah Ghat",
        "reported_by": "Port Trust Environmental Officer",
        "severity": "HIGH",
        "category": "Vessel Diesel Exhaust & Brick Kiln Plume",
        "narrative": (
            "Older inland diesel tugboats emitting excessive black particulate smoke during mooring maneuvers. "
            "Combined with transboundary smoke from Hooghly riverbank brick kilns under morning winter calm conditions. "
            "Station CCU-HOWRAH registered AQI 324 ('Very Poor'). Notice served to vessel operators."
        ),
        "status": "INSPECTION_PENDING"
    }
]


def generate_unstructured_sensor_logs(num_logs=25000):
    """Generate thousands of authentic unstructured IoT machine logs."""
    log_file_path = os.path.join(BASE_DIR, "unstructured_iot_sensor_stream.log")
    print(f"Generating {num_logs:,} unstructured IoT sensor machine logs...")

    start_date = datetime(2024, 1, 1, 0, 0, 0)
    lines = []

    # Seasonal pollution factors: higher in winter (Jan-Feb, Oct-Dec)
    for i in range(num_logs):
        # Step forward temporally
        time_offset = timedelta(minutes=int(i * (365 * 24 * 60 / num_logs)))
        ts = start_date + time_offset
        ts_str = ts.strftime("%Y-%m-%d %H:%M:%S") + f".{random.randint(100, 999)}"

        city_data = random.choice(CITIES)
        station_name = random.choice(city_data["stations"])
        node_id = f"NODE-{city_data['prefix']}-{station_name[:6].upper()}-{random.randint(1, 9):02d}"

        # Winter pollution amplification
        is_winter = ts.month in [1, 2, 11, 12]
        base_pm25 = (140 if is_winter else 45) if city_data["name"] in ["Delhi", "Lucknow", "Jaipur"] else (65 if is_winter else 35)
        pm25 = max(5.0, random.gauss(base_pm25, base_pm25 * 0.4))
        pm10 = max(pm25 * 1.2, pm25 * random.uniform(1.4, 2.2))
        no2 = max(8.0, random.gauss(42.0, 15.0))
        so2 = max(4.0, random.gauss(14.0, 6.0))
        co = max(0.4, random.gauss(1.2, 0.6))
        o3 = max(10.0, random.gauss(38.0, 14.0))
        temp = max(8.0, random.gauss(24.0, 8.0))
        rh = min(98.0, max(25.0, random.gauss(65.0, 18.0)))
        ws = max(0.5, random.gauss(6.5, 3.5))

        # Select template based on values
        if pm25 > 250:
            level = "CRIT"
            tmpl = LOG_TEMPLATES[5][1] # Hazardous alert
        elif pm25 > 150 and random.random() < 0.4:
            level = "WARN"
            tmpl = LOG_TEMPLATES[4][1] # surge
        elif rh > 80 and random.random() < 0.35:
            level = "WARN"
            tmpl = LOG_TEMPLATES[2][1] # humidity compensation
        elif random.random() < 0.08:
            level = "WARN"
            tmpl = LOG_TEMPLATES[3][1] # lens attenuation
        elif random.random() < 0.05:
            level = "DEBUG"
            tmpl = LOG_TEMPLATES[7][1] # health check
        elif random.random() < 0.4:
            level = "INFO"
            tmpl = LOG_TEMPLATES[1][1] # SPS30 bins
        else:
            level = "INFO"
            tmpl = LOG_TEMPLATES[0][1] # OPC telemetry

        msg = tmpl.format(
            flow=random.uniform(1.15, 1.25),
            laser=random.uniform(18.0, 24.5),
            pm25=pm25,
            pm10=pm10,
            no2=no2,
            so2=so2,
            co=co,
            o3=o3,
            temp=temp,
            rh=rh,
            ws=ws,
            crc=random.randint(0x1000, 0xFFFF),
            bin03=random.randint(12000, 45000),
            bin05=random.randint(4000, 18000),
            bin10=random.randint(800, 4200),
            bin25=random.randint(120, 950),
            volt=random.uniform(1.85, 2.45),
            bus_v=random.uniform(4.92, 5.08),
            duty=random.randint(45, 95),
            raw_pm=pm25 * random.uniform(1.2, 1.6),
            atten=random.uniform(12.0, 32.0),
            drift=random.uniform(0.12, 0.88),
            purge=random.randint(250, 800),
            delta=random.uniform(25.0, 85.0),
            co_delta=random.uniform(0.35, 1.2),
            inv=random.randint(110, 280),
            uptime=random.randint(86400, 2592000),
            ram_free=random.randint(128, 512),
            flash=random.randint(1200, 8500),
            psu_temp=random.uniform(28.0, 46.0),
            mppt=random.uniform(94.0, 98.5),
            rssi=random.randint(58, 88)
        )

        log_line = f"[{ts_str}] [{node_id}] [{level}] {msg}\n"
        lines.append(log_line)

    with open(log_file_path, "w", encoding="utf-8") as f:
        f.writelines(lines)

    file_size_mb = os.path.getsize(log_file_path) / (1024 * 1024)
    print(f"Generated {len(lines):,} unstructured logs -> {log_file_path} ({file_size_mb:.2f} MB)")
    return log_file_path


def generate_unstructured_bulletins_and_incidents():
    """Write unstructured environmental bulletins and citizen incident files."""
    bulletins_path = os.path.join(BASE_DIR, "unstructured_environmental_bulletins.json")
    with open(bulletins_path, "w", encoding="utf-8") as f:
        json.dump(BULLETINS, f, indent=2)
    print(f"Generated {len(BULLETINS)} unstructured bulletins -> {bulletins_path}")

    incidents_path = os.path.join(BASE_DIR, "unstructured_citizen_incidents.log")
    with open(incidents_path, "w", encoding="utf-8") as f:
        for inc in CITIZEN_INCIDENTS:
            f.write(f"=== INCIDENT REPORT {inc['incident_id']} ===\n")
            f.write(f"TIMESTAMP:   {inc['timestamp']}\n")
            f.write(f"CITY/LOC:    {inc['city']} - {inc['location']}\n")
            f.write(f"REPORTED BY: {inc['reported_by']}\n")
            f.write(f"SEVERITY:    {inc['severity']} | CATEGORY: {inc['category']} | STATUS: {inc['status']}\n")
            f.write(f"NARRATIVE:\n{inc['narrative']}\n\n")
    print(f"Generated {len(CITIZEN_INCIDENTS)} unstructured incidents -> {incidents_path}")


if __name__ == "__main__":
    generate_unstructured_sensor_logs(num_logs=25000)
    generate_unstructured_bulletins_and_incidents()
    print("All Unstructured Big Data assets generated successfully!")
