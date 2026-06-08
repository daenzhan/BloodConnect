--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_audit_logs (
    id bigint NOT NULL,
    admin_id bigint NOT NULL,
    admin_email character varying(255),
    action character varying(100),
    target_type character varying(50),
    target_id bigint,
    details text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admin_audit_logs OWNER TO postgres;

--
-- Name: admin_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_audit_logs_id_seq OWNER TO postgres;

--
-- Name: admin_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_audit_logs_id_seq OWNED BY public.admin_audit_logs.id;


--
-- Name: analyses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.analyses (
    analysis_id bigint NOT NULL,
    donation_id bigint NOT NULL,
    blood_center_id bigint NOT NULL,
    status character varying(255) NOT NULL,
    hiv character varying(255),
    brucellosis character varying(255),
    hepatitis_b character varying(255),
    hepatitis_c character varying(255),
    syphilis character varying(255),
    alt_level double precision,
    blood_group character varying(255),
    rhesus_factor character varying(255),
    hemoglobin double precision,
    analysis_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    technician_notes character varying(255),
    CONSTRAINT chk_analysis_status CHECK (((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('COMPLETED'::character varying)::text, ('FAILED'::character varying)::text, ('CLEAN'::character varying)::text, ('INFECTED'::character varying)::text])))
);


ALTER TABLE public.analyses OWNER TO postgres;

--
-- Name: TABLE analyses; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.analyses IS 'Результаты анализов сданной крови';


--
-- Name: analyses_analysis_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.analyses_analysis_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.analyses_analysis_id_seq OWNER TO postgres;

--
-- Name: analyses_analysis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.analyses_analysis_id_seq OWNED BY public.analyses.analysis_id;


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointments (
    appointment_id bigint NOT NULL,
    bloodcenter_id bigint NOT NULL,
    donor_id bigint NOT NULL,
    appointment_date timestamp without time zone,
    status character varying(255) DEFAULT 'SCHEDULED'::character varying,
    notes character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- Name: TABLE appointments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.appointments IS 'Записи доноров на сдачу крови';


--
-- Name: appointments_appointment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.appointments_appointment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.appointments_appointment_id_seq OWNER TO postgres;

--
-- Name: appointments_appointment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.appointments_appointment_id_seq OWNED BY public.appointments.appointment_id;


--
-- Name: blood_reserves; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blood_reserves (
    reserve_id bigint NOT NULL,
    analysis_id bigint,
    blood_group character varying(255) NOT NULL,
    component_type character varying(255) NOT NULL,
    created_date timestamp(6) without time zone NOT NULL,
    donation_id bigint NOT NULL,
    donor_id bigint NOT NULL,
    expiration_date timestamp(6) without time zone NOT NULL,
    in_quarantine boolean NOT NULL,
    is_available boolean NOT NULL,
    notes character varying(255),
    quantity integer NOT NULL,
    quarantine_end_date timestamp(6) without time zone,
    rhesus_factor character varying(255) NOT NULL,
    blood_center_id bigint NOT NULL
);


ALTER TABLE public.blood_reserves OWNER TO postgres;

--
-- Name: blood_reserves_reserve_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.blood_reserves ALTER COLUMN reserve_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.blood_reserves_reserve_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: bloodcenters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bloodcenters (
    bloodcenter_id bigint NOT NULL,
    user_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    location character varying(255) NOT NULL,
    city character varying(255) NOT NULL,
    specialization character varying(255),
    license_file character varying(255),
    director_full_name character varying(255),
    latitude double precision,
    longitude double precision,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    verification_status character varying(255),
    rejection_reason character varying(255),
    verified_by bigint,
    verified_at timestamp without time zone
);


ALTER TABLE public.bloodcenters OWNER TO postgres;

--
-- Name: TABLE bloodcenters; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.bloodcenters IS 'Центры крови';


--
-- Name: bloodcenters_bloodcenter_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bloodcenters_bloodcenter_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bloodcenters_bloodcenter_id_seq OWNER TO postgres;

--
-- Name: bloodcenters_bloodcenter_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bloodcenters_bloodcenter_id_seq OWNED BY public.bloodcenters.bloodcenter_id;


--
-- Name: bloodrequests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bloodrequests (
    bloodrequest_id bigint NOT NULL,
    medcenter_id bigint NOT NULL,
    bloodcenter_id bigint,
    component_type character varying(255) NOT NULL,
    blood_group character varying(255) NOT NULL,
    rhesus_factor character varying(255) NOT NULL,
    volume character varying(255) NOT NULL,
    deadline timestamp without time zone,
    status character varying(255),
    comment character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_request_blood_group CHECK (((blood_group)::text = ANY (ARRAY[('A'::character varying)::text, ('B'::character varying)::text, ('AB'::character varying)::text, ('O'::character varying)::text]))),
    CONSTRAINT chk_request_rhesus CHECK (((rhesus_factor)::text = ANY ((ARRAY['POSITIVE'::character varying, 'NEGATIVE'::character varying, '+'::character varying, '-'::character varying])::text[]))),
    CONSTRAINT chk_request_status CHECK (((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('APPROVED'::character varying)::text, ('FULFILLED'::character varying)::text, ('REJECTED'::character varying)::text, ('EXPIRED'::character varying)::text])))
);


ALTER TABLE public.bloodrequests OWNER TO postgres;

--
-- Name: TABLE bloodrequests; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.bloodrequests IS 'Заявки на кровь от медицинских центров';


--
-- Name: bloodrequests_bloodrequest_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bloodrequests_bloodrequest_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bloodrequests_bloodrequest_id_seq OWNER TO postgres;

--
-- Name: bloodrequests_bloodrequest_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bloodrequests_bloodrequest_id_seq OWNED BY public.bloodrequests.bloodrequest_id;


--
-- Name: donations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.donations (
    donation_id bigint NOT NULL,
    bloodcenter_id bigint NOT NULL,
    donor_id bigint NOT NULL,
    appointment_id bigint,
    analysis_id bigint,
    donation_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    has_analysis boolean DEFAULT false,
    status character varying(255) DEFAULT 'PENDING'::character varying,
    CONSTRAINT chk_donation_status CHECK (((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('COMPLETED'::character varying)::text, ('REJECTED'::character varying)::text, ('CANCELLED'::character varying)::text])))
);


ALTER TABLE public.donations OWNER TO postgres;

--
-- Name: TABLE donations; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.donations IS 'Факты сдачи крови';


--
-- Name: donations_donation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.donations_donation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.donations_donation_id_seq OWNER TO postgres;

--
-- Name: donations_donation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.donations_donation_id_seq OWNED BY public.donations.donation_id;


--
-- Name: donor_calls; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.donor_calls (
    id bigint NOT NULL,
    blood_group character varying(255) NOT NULL,
    component_type character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    donor_id bigint NOT NULL,
    expires_at timestamp(6) without time zone NOT NULL,
    message text,
    responded_at timestamp(6) without time zone,
    response character varying(255),
    rhesus_factor character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    blood_center_id bigint NOT NULL
);


ALTER TABLE public.donor_calls OWNER TO postgres;

--
-- Name: donor_calls_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.donor_calls ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.donor_calls_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: donors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.donors (
    donor_id bigint NOT NULL,
    user_id bigint NOT NULL,
    full_name character varying(255) NOT NULL,
    birth_date date NOT NULL,
    iin character varying(12) NOT NULL,
    weight double precision NOT NULL,
    height double precision NOT NULL,
    blood_group character varying(255),
    rhesus_factor character varying(255),
    address character varying(255) NOT NULL,
    city character varying(255) NOT NULL,
    gender character varying(255) NOT NULL,
    last_donation_date date,
    donation_count integer DEFAULT 0,
    rating integer DEFAULT 0,
    points integer DEFAULT 0,
    donor_status character varying(255) DEFAULT 'ACTIVE'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_donor_blood_group CHECK (((blood_group)::text = ANY (ARRAY[('A'::character varying)::text, ('B'::character varying)::text, ('AB'::character varying)::text, ('O'::character varying)::text]))),
    CONSTRAINT chk_donor_gender CHECK (((gender)::text = ANY (ARRAY[('MALE'::character varying)::text, ('FEMALE'::character varying)::text, ('OTHER'::character varying)::text]))),
    CONSTRAINT chk_donor_rhesus CHECK (((rhesus_factor)::text = ANY (ARRAY[('Positive'::character varying)::text, ('Negative'::character varying)::text, ('+'::character varying)::text, ('-'::character varying)::text]))),
    CONSTRAINT chk_donor_status CHECK (((donor_status)::text = ANY (ARRAY[('ACTIVE'::character varying)::text, ('TEMPORARY_BLOCKED'::character varying)::text, ('PERMANENT_BLOCKED'::character varying)::text])))
);


ALTER TABLE public.donors OWNER TO postgres;

--
-- Name: TABLE donors; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.donors IS 'Профили доноров';


--
-- Name: donors_donor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.donors_donor_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.donors_donor_id_seq OWNER TO postgres;

--
-- Name: donors_donor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.donors_donor_id_seq OWNED BY public.donors.donor_id;


--
-- Name: email_verifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_verifications (
    id bigint NOT NULL,
    email character varying(255) NOT NULL,
    verification_code character varying(255) NOT NULL,
    expiry_date timestamp without time zone NOT NULL,
    verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.email_verifications OWNER TO postgres;

--
-- Name: email_verifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_verifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_verifications_id_seq OWNER TO postgres;

--
-- Name: email_verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_verifications_id_seq OWNED BY public.email_verifications.id;


--
-- Name: medcenters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medcenters (
    medcenter_id bigint NOT NULL,
    user_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    location character varying(255) NOT NULL,
    license_file character varying(255),
    director_full_name character varying(255),
    specialization character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    verification_status character varying(255),
    rejection_reason character varying(255),
    verified_at timestamp without time zone,
    verified_by bigint
);


ALTER TABLE public.medcenters OWNER TO postgres;

--
-- Name: TABLE medcenters; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.medcenters IS 'Медицинские центры (заказчики крови)';


--
-- Name: medcenters_medcenter_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.medcenters_medcenter_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.medcenters_medcenter_id_seq OWNER TO postgres;

--
-- Name: medcenters_medcenter_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.medcenters_medcenter_id_seq OWNED BY public.medcenters.medcenter_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id bigint NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(255) NOT NULL,
    phone_number character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    blocked_reason character varying(255),
    is_active boolean
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.users IS 'Пользователи системы (аутентификация)';


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: admin_audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.admin_audit_logs_id_seq'::regclass);


--
-- Name: analyses analysis_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analyses ALTER COLUMN analysis_id SET DEFAULT nextval('public.analyses_analysis_id_seq'::regclass);


--
-- Name: appointments appointment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments ALTER COLUMN appointment_id SET DEFAULT nextval('public.appointments_appointment_id_seq'::regclass);


--
-- Name: bloodcenters bloodcenter_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bloodcenters ALTER COLUMN bloodcenter_id SET DEFAULT nextval('public.bloodcenters_bloodcenter_id_seq'::regclass);


--
-- Name: bloodrequests bloodrequest_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bloodrequests ALTER COLUMN bloodrequest_id SET DEFAULT nextval('public.bloodrequests_bloodrequest_id_seq'::regclass);


--
-- Name: donations donation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations ALTER COLUMN donation_id SET DEFAULT nextval('public.donations_donation_id_seq'::regclass);


--
-- Name: donors donor_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donors ALTER COLUMN donor_id SET DEFAULT nextval('public.donors_donor_id_seq'::regclass);


--
-- Name: email_verifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verifications ALTER COLUMN id SET DEFAULT nextval('public.email_verifications_id_seq'::regclass);


--
-- Name: medcenters medcenter_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medcenters ALTER COLUMN medcenter_id SET DEFAULT nextval('public.medcenters_medcenter_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: admin_audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_audit_logs (id, admin_id, admin_email, action, target_type, target_id, details, created_at) FROM stdin;
\.


--
-- Data for Name: analyses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.analyses (analysis_id, donation_id, blood_center_id, status, hiv, brucellosis, hepatitis_b, hepatitis_c, syphilis, alt_level, blood_group, rhesus_factor, hemoglobin, analysis_date, technician_notes) FROM stdin;
400	300	4	COMPLETED	NEGATIVE	NEGATIVE	NEGATIVE	NEGATIVE	NEGATIVE	25	A	POSITIVE	135	2026-05-15 14:00:00	All tests normal
401	301	4	COMPLETED	NEGATIVE	NEGATIVE	NEGATIVE	NEGATIVE	NEGATIVE	30	O	POSITIVE	142	2026-05-16 14:30:00	Healthy donor
402	303	4	COMPLETED	NEGATIVE	NEGATIVE	NEGATIVE	NEGATIVE	NEGATIVE	22	AB	POSITIVE	138	2026-05-10 15:30:00	Good health
403	304	4	COMPLETED	NEGATIVE	NEGATIVE	NEGATIVE	NEGATIVE	NEGATIVE	28	A	NEGATIVE	132	2026-05-11 16:00:00	Normal results
404	306	4	COMPLETED	NEGATIVE	NEGATIVE	NEGATIVE	NEGATIVE	NEGATIVE	35	B	POSITIVE	140	2026-05-09 12:00:00	All good
405	307	4	COMPLETED	NEGATIVE	NEGATIVE	NEGATIVE	NEGATIVE	NEGATIVE	20	AB	NEGATIVE	145	2026-05-12 14:30:00	Excellent results
406	309	4	COMPLETED	NEGATIVE	NEGATIVE	NEGATIVE	NEGATIVE	NEGATIVE	32	O	NEGATIVE	136	2026-05-08 11:30:00	Good donor
11	11	6	COMPLETED	NEGATIVE	NEGATIVE	NEGATIVE	NEGATIVE	NEGATIVE	40	A	POSITIVE	125	2026-10-11 01:22:38.153392	very very good blood
12	12	6	COMPLETED	NEGATIVE	NEGATIVE	NEGATIVE	NEGATIVE	NEGATIVE	50	A	POSITIVE	115	2026-06-09 01:42:29.620875	ooo
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appointments (appointment_id, bloodcenter_id, donor_id, appointment_date, status, notes, created_at, updated_at) FROM stdin;
200	4	100	2026-05-15 10:00:00	COMPLETED	Regular donation	2026-05-15 16:17:55.574277	2026-05-15 16:17:55.574277
201	4	101	2026-05-16 11:00:00	COMPLETED	First time donor	2026-05-15 16:17:55.574277	2026-05-15 16:17:55.574277
202	4	102	2026-05-17 09:00:00	SCHEDULED	Routine check	2026-05-15 16:17:55.574277	2026-05-15 16:17:55.574277
203	4	103	2026-05-10 14:00:00	COMPLETED	Emergency donation	2026-05-15 16:17:55.574277	2026-05-15 16:17:55.574277
204	4	104	2026-05-11 15:00:00	COMPLETED	Regular donor	2026-05-15 16:17:55.574277	2026-05-15 16:17:55.574277
205	4	105	2026-05-18 12:00:00	SCHEDULED	Blood drive	2026-05-15 16:17:55.574277	2026-05-15 16:17:55.574277
206	4	106	2026-05-09 10:30:00	COMPLETED	First donation	2026-05-15 16:17:55.574277	2026-05-15 16:17:55.574277
207	4	107	2026-05-12 13:00:00	COMPLETED	Plasma donation	2026-05-15 16:17:55.574277	2026-05-15 16:17:55.574277
208	4	108	2026-05-19 16:00:00	SCHEDULED	Platelet donation	2026-05-15 16:17:55.574277	2026-05-15 16:17:55.574277
209	4	109	2026-05-08 09:30:00	COMPLETED	Regular donor	2026-05-15 16:17:55.574277	2026-05-15 16:17:55.574277
210	4	110	2026-05-20 11:30:00	SCHEDULED	Blood donation	2026-05-15 16:17:55.574277	2026-05-15 16:17:55.574277
4	6	6	2026-06-10 10:00:00	REJECTED	Booked via web interface	2026-06-09 00:50:12.237201	2026-10-11 01:23:43.484965
5	6	7	2026-06-09 09:00:00	REJECTED	Booked via web interface	2026-06-09 01:42:21.639874	2026-06-09 01:42:59.812478
\.


--
-- Data for Name: blood_reserves; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blood_reserves (reserve_id, analysis_id, blood_group, component_type, created_date, donation_id, donor_id, expiration_date, in_quarantine, is_available, notes, quantity, quarantine_end_date, rhesus_factor, blood_center_id) FROM stdin;
2	0	B	PLASMA	2026-05-25 14:49:38.88425	1779702578870	1	2029-05-25 14:49:38.88425	t	f	Manually added to inventory	250	2026-08-23 14:49:38.87033	POSITIVE	4
3	0	B	RED_BLOOD_CELLS	2026-05-25 15:37:17.832273	1779705437821	1	2026-07-06 15:37:17.832273	f	t	dsvhdbvjhdjv	450	\N	NEGATIVE	4
4	0	A	RED_BLOOD_CELLS	2026-05-25 15:37:56.872663	1779705476871	1	2026-07-06 15:37:56.872663	f	t	grthrh	450	\N	NEGATIVE	4
5	0	O	PLASMA	2026-05-25 15:38:35.09572	1779705515095	1	2029-05-25 15:38:35.09572	t	f	brfhrfhh	450	2026-08-23 15:38:35.09572	NEGATIVE	4
6	0	B	RED_BLOOD_CELLS	2026-05-25 15:40:29.967888	1779705629967	1	2026-07-06 15:40:29.967888	f	t	Manually added to inventory	450	\N	NEGATIVE	4
\.


--
-- Data for Name: bloodcenters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bloodcenters (bloodcenter_id, user_id, name, location, city, specialization, license_file, director_full_name, latitude, longitude, created_at, verification_status, rejection_reason, verified_by, verified_at) FROM stdin;
4	14	NurCenter	улица Таттимбета, район Сарыарка, Астана, Z10M9K9, Казахстан	Astana	SPECIALIZED_CLINIC	\N	Nurila Bakhramova	51.17353121934386	71.40322838036039	2026-05-16 17:27:56.79921	APPROVED	\N	1	2026-06-08 01:35:04.732272
6	27	Asel Blood Center	Red Dragon, 55, улица Манаса, Коктем, Бостандыкский район, Алматы, 050000, Казахстан	Almaty	SPECIALIZED_CLINIC	BLOOD_CENTER_27_705a42b4-a062-45ba-b3dc-6b4eb314ed49.jpg	Asel Kuanyshbek	43.235076988915196	76.90936132784225	2026-06-08 18:24:51.200024	APPROVED	\N	1	2026-06-08 18:25:32.613697
\.


--
-- Data for Name: bloodrequests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bloodrequests (bloodrequest_id, medcenter_id, bloodcenter_id, component_type, blood_group, rhesus_factor, volume, deadline, status, comment, created_at) FROM stdin;
9	7	4	RED_BLOOD_CELLS	B	NEGATIVE	250 ml	2026-05-30 10:57:00	PENDING	tyugyuhuh	2026-05-25 16:00:08.501758
\.


--
-- Data for Name: donations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.donations (donation_id, bloodcenter_id, donor_id, appointment_id, analysis_id, donation_date, has_analysis, status) FROM stdin;
300	4	100	200	\N	2026-05-15 10:30:00	t	COMPLETED
301	4	101	201	\N	2026-05-16 11:30:00	t	COMPLETED
302	4	102	202	\N	\N	f	PENDING
303	4	103	203	\N	2026-05-10 14:30:00	t	COMPLETED
304	4	104	204	\N	2026-05-11 15:30:00	t	COMPLETED
305	4	105	205	\N	\N	f	PENDING
306	4	106	206	\N	2026-05-09 11:00:00	t	COMPLETED
307	4	107	207	\N	2026-05-12 13:30:00	t	COMPLETED
308	4	108	208	\N	\N	f	PENDING
309	4	109	209	\N	2026-05-08 10:00:00	t	COMPLETED
310	4	110	210	\N	\N	f	PENDING
11	6	6	4	\N	2026-10-11 01:22:38.111501	f	REJECTED
12	6	7	5	\N	2026-06-09 01:42:29.614912	f	REJECTED
\.


--
-- Data for Name: donor_calls; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.donor_calls (id, blood_group, component_type, created_at, donor_id, expires_at, message, responded_at, response, rhesus_factor, status, blood_center_id) FROM stdin;
\.


--
-- Data for Name: donors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.donors (donor_id, user_id, full_name, birth_date, iin, weight, height, blood_group, rhesus_factor, address, city, gender, last_donation_date, donation_count, rating, points, donor_status, created_at) FROM stdin;
2	3	Test Donor	1995-01-01	950101450001	70	175	A	Positive	Test Address 1	Almaty	MALE	\N	0	0	0	ACTIVE	2026-05-12 04:31:33.937543
102	102	Айым Серикова	2000-11-10	001110500789	58	165	B	Negative	мкр. Орбита 1, д.12	Алматы	FEMALE	2026-05-01	8	65	400	ACTIVE	2026-05-15 16:17:15.873861
105	105	Ерасыл Болатов	1997-12-03	971203600890	85	190	O	Positive	пр. Назарбаева 10	Шымкент	MALE	2026-04-18	30	88	1500	ACTIVE	2026-05-15 16:17:15.873861
110	110	Диана Арманова	1997-04-12	970412300345	63	166	B	Positive	ул. Гоголя 5	Актобе	FEMALE	2026-03-28	15	72	750	ACTIVE	2026-05-15 16:17:15.873861
111	111	Мұхтар Алиев	1995-01-08	950108600678	80	184	AB	Positive	мкр. Нуркент 8	Нур-Султан	MALE	2026-04-05	22	82	1100	ACTIVE	2026-05-15 16:17:15.873861
112	112	Жанел Куатова	1998-06-30	980630900901	57	163	A	Negative	ул. Сатпаева 22	Караганда	FEMALE	2026-03-12	10	68	500	ACTIVE	2026-05-15 16:17:15.873861
113	113	Арсен Даулетов	2000-01-15	000115450234	70	176	O	Positive	пр. Шаляпина 7	Алматы	MALE	2026-04-30	7	62	350	ACTIVE	2026-05-15 16:17:15.873861
114	114	Камиля Русланова	1999-09-05	990905300567	59	168	B	Negative	ул. Момышулы 14	Шымкент	FEMALE	2026-05-08	4	52	200	ACTIVE	2026-05-15 16:17:15.873861
115	115	Тамерлан Азатов	1996-11-17	961117400890	92	192	AB	Positive	мкр. Акбулак 2	Алматы	MALE	2026-01-15	52	98	2600	ACTIVE	2026-05-15 16:17:15.873861
108	108	Томирис Жаксылык	2001-08-20	010820900789	55	160	A	Positive	ул. Жибек Жолы 12	Алматы	FEMALE	2026-04-22	3	45	150	ACTIVE	2026-05-15 16:17:15.873861
100	100	Tamara Kazybayeva	1995-03-15	950315400123	65	168	A	Positive	пр. Достык 15, кв.45	Алматы	FEMALE	2026-05-15	28	85	1400	ACTIVE	2026-05-15 16:17:15.873861
5	20	Tamara Kazybayeva	2005-07-13	050713601240	55	160	A	Positive	​Улица Манаса, 34/1	Almaty	FEMALE	\N	0	0	0	ACTIVE	2026-06-08 00:41:25.606894
6	28	Alikhan Esengaliev	2005-08-07	050807266355	67	180	A	Positive	​Улица Манаса, 34/1	Almaty	MALE	\N	0	0	0	ACTIVE	2026-06-09 00:49:36.061745
7	30	Asel Kuanyshbek	2005-07-13	050713601244	60	170	A	Positive	​Улица Манаса, 34/1	Almaty	FEMALE	\N	0	0	0	ACTIVE	2026-06-09 01:42:05.871026
101	101	Диас Жаксылыков	1998-07-22	980722300456	78	182	O	Positive	ул. Толе би 25	Алматы	MALE	2026-05-16	19	80	950	ACTIVE	2026-05-15 16:17:15.873861
106	106	Айша Каримова	1999-02-28	990228700123	60	162	B	Positive	ул. Пушкина 8	Караганда	FEMALE	2026-05-09	6	60	300	ACTIVE	2026-05-15 16:17:15.873861
107	107	Алишер Сакенов	1994-06-14	940614800456	75	178	AB	Negative	мкр. Астана 3, д.15	Нур-Султан	MALE	2026-05-12	36	92	1800	ACTIVE	2026-05-15 16:17:15.873861
109	109	Бекзат Нургалиев	1992-10-25	921025450012	88	188	O	Negative	пр. Республики 30	Нур-Султан	MALE	2026-05-08	49	97	2450	ACTIVE	2026-05-15 16:17:15.873861
103	103	Нурислам Тлеуов	1993-05-05	930505300234	82	185	AB	Positive	ул. Абая 50	Нур-Султан	MALE	2026-05-10	45	92	2250	ACTIVE	2026-05-15 16:17:15.873861
104	104	Мадина Омарова	1996-09-18	960918450567	62	170	A	Negative	мкр. Самал 2, д.5	Алматы	FEMALE	2026-05-11	12	70	600	ACTIVE	2026-05-15 16:17:15.873861
\.


--
-- Data for Name: email_verifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_verifications (id, email, verification_code, expiry_date, verified, created_at) FROM stdin;
44	34376@iitu.edu.kz	227743	2026-05-11 19:25:57.170927	t	2026-05-11 19:10:57.170927
49	nurilabakramova95@gmail.com	634513	2026-05-16 17:40:47.35494	t	2026-05-16 17:25:47.35494
50	aru.nur.2019@gmail.com	074654	2026-05-16 17:55:12.497662	t	2026-05-16 17:40:12.497662
54	kazybaeva.tamara2005@mail.ru	185493	2026-05-25 13:16:47.854789	t	2026-05-25 13:01:47.854789
55	tamara.kazybaeva2005@gmail.com	131469	2026-06-07 23:32:47.808031	t	2026-06-07 23:17:47.808031
56	donor@mail.com	076262	2026-06-08 00:55:09.9089	t	2026-06-08 00:40:09.9089
62	ttmira7@gmail.com	435987	2026-06-08 16:41:36.009982	t	2026-06-08 16:26:36.009982
63	erikbaevaovechka@gmail.com	900330	2026-06-08 18:35:56.824966	t	2026-06-08 18:20:56.824966
64	esengaliev2005@gmail.com	537763	2026-06-09 01:02:49.620162	t	2026-06-09 00:47:49.620162
65	sabina@mail.com	034128	2026-06-09 01:54:57.493802	t	2026-06-09 01:39:57.493802
\.


--
-- Data for Name: medcenters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.medcenters (medcenter_id, user_id, name, location, license_file, director_full_name, specialization, created_at, verification_status, rejection_reason, verified_at, verified_by) FROM stdin;
10	19	TamaraClinic	​Улица Манаса, 34/1	\N	Tamara	SPECIALIZED_CLINIC	2026-06-07 23:18:37.099403	APPROVED	\N	2026-06-07 23:24:27.054824	1
7	15	NurMed	​Улица Манаса, 34/1	\N	Aruzhan Nuriddinova	SPECIALIZED_CLINIC	2026-05-16 17:41:38.895181	APPROVED	\N	2026-06-08 02:58:21.510338	1
16	26	Mira clinic	​Улица Манаса, 34/1	\N	Tamara	SPECIALIZED_CLINIC	2026-06-08 16:27:56.882516	APPROVED	\N	2026-06-08 16:32:18.209394	1
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--
-- Seed test credentials:
--   admin@test.com   / Admin1234!  (role: ADMIN)
--   donor@test.com   / Donor1234!  (role: DONOR)
--

COPY public.users (user_id, email, password, role, phone_number, created_at, blocked_reason, is_active) FROM stdin;
1	admin@bloodconnect.com	$2a$12$.L9LzMGWQIZR1cL5/uYmHOaDIv3r0CB0B1P8zUF2NMHiMbMaCPVgC	ADMIN	+77770000000	2026-05-12 04:31:33.937543	\N	t
2	admin@test.com	$2a$10$MBYnfY16Fp7bR85mMLIQ5O.qQFyKNeC0k3eHKwI5lMwtVKj8d8xBW	ADMIN	+77770000001	2026-05-12 04:31:33.937543	\N	t
3	donor@test.com	$2a$10$WVn9oW8fFS/FpZVwwRxpYeUP915HThumxlVyYhiFhnlSNkbZIof2S	DONOR	+77770000002	2026-05-12 04:31:33.937543	\N	t
27	erikbaevaovechka@gmail.com	$2a$10$WhNrAsxlZepXJFeNIDuFwulX.qszNG86ZNfsMK/TxUeExTfXiVqOG	BLOOD_CENTER	+77762330133	2026-06-08 18:24:51.14679	\N	t
26	ttmira7@gmail.com	$2a$10$Avr7zV2KnE7BH7xixIQaHeANWrFxgRl9OqHyugYfUtZ3FWrTynRUS	MEDICAL_CENTER	+77777777745	2026-06-08 16:27:56.879853	fake user	f
28	esengaliev2005@gmail.com	$2a$10$yZDRZvn0qawquctYZ2lHXOP7I2YPVA9F78CKakyiNbvDYsWUb/CKK	DONOR	+77762330138	2026-06-09 00:49:36.047728	\N	t
30	sabina@mail.com	$2a$10$3YogO92k6zTJY356M3hxvuYAi1hnTXlNv50NYIDFerVTriQsGhvG6	DONOR	+77777777758	2026-06-09 01:42:05.863362	\N	t
101	dias.zhaksylyk@mail.kz	$2a$10$YourHashedPasswordHere	DONOR	+77021234568	2026-05-15 16:08:03.997047	\N	t
102	aiym.serik@mail.kz	$2a$10$YourHashedPasswordHere	DONOR	+77031234569	2026-05-15 16:08:03.997047	\N	t
103	nurislam.tleu@mail.kz	$2a$10$YourHashedPasswordHere	DONOR	+77041234570	2026-05-15 16:08:03.997047	\N	t
104	madina.omar@mail.kz	$2a$10$YourHashedPasswordHere	DONOR	+77051234571	2026-05-15 16:08:03.997047	\N	t
105	yerassyl.bolat@mail.kz	$2a$10$YourHashedPasswordHere	DONOR	+77061234572	2026-05-15 16:08:03.997047	\N	t
106	aisha.karim@mail.kz	$2a$10$YourHashedPasswordHere	DONOR	+77071234573	2026-05-15 16:08:03.997047	\N	t
107	alisher.saken@mail.kz	$2a$10$YourHashedPasswordHere	DONOR	+77081234574	2026-05-15 16:08:03.997047	\N	t
108	tomiris.zhaksy@mail.kz	$2a$10$YourHashedPasswordHere	DONOR	+77091234575	2026-05-15 16:08:03.997047	\N	t
109	bekzat.nurgali@mail.kz	$2a$10$YourHashedPasswordHere	DONOR	+77101234576	2026-05-15 16:08:03.997047	\N	t
110	diana.arman@mail.kz	$2a$10$YourHashedPasswordHere	DONOR	+77111234577	2026-05-15 16:08:03.997047	\N	t
111	mukhtar.ali@mail.kz	$2a$10$YourHashedPasswordHere	DONOR	+77121234578	2026-05-15 16:08:03.997047	\N	t
112	zhanel.kuat@mail.kz	$2a$10$YourHashedPasswordHere	DONOR	+77131234579	2026-05-15 16:08:03.997047	\N	t
113	arsen.daulet@mail.kz	$2a$10$YourHashedPasswordHere	DONOR	+77141234580	2026-05-15 16:08:03.997047	\N	t
114	kamilya.ruslan@mail.kz	$2a$10$YourHashedPasswordHere	DONOR	+77151234581	2026-05-15 16:08:03.997047	\N	t
115	tamerlan.azat@mail.kz	$2a$10$YourHashedPasswordHere	DONOR	+77161234582	2026-05-15 16:08:03.997047	\N	t
100	aruzhan.nur@mail.kz	$2a$12$W9SniqYu6kZHycFfu4Dkd.F7oY9hyqR9eUAMZN74RyfOwybleE.Hq	DONOR	+77011234567	2026-05-15 16:08:03.997047	\N	t
14	nurilabakramova95@gmail.com	$2a$10$lvj281/XUB0BPeY19AzsgepqVPNxVH6vtez6/bGdM9c8M5ip8RSwe	BLOOD_CENTER	+77777777774	2026-05-16 17:27:56.797143	\N	t
15	aru.nur.2019@gmail.com	$2a$10$sVj3MXYrg7HIdCQxlnX1z.USzu4A6E2KOOFq3DJhpZv2n5zuUG6qC	MEDICAL_CENTER	+77777777775	2026-05-16 17:41:38.874534	\N	t
19	tamara.kazybaeva2005@gmail.com	$2a$10$fUXYmFXw3dP4ImVspGXw5evHHDrRIIqccPzzDUU2skCe4e1XBXcxi	MEDICAL_CENTER	+77777777776	2026-06-07 23:18:37.092468	\N	t
20	donor@mail.com	$2a$10$ysfFjm5QNfitNDgRd7H.KOpiKQZ5T4MVcEjWM2Xbzr3z/IajRlFwm	DONOR	+77777777773	2026-06-08 00:41:25.60178	\N	t
\.


--
-- Name: admin_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_audit_logs_id_seq', 1, false);


--
-- Name: analyses_analysis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.analyses_analysis_id_seq', 12, true);


--
-- Name: appointments_appointment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.appointments_appointment_id_seq', 5, true);


--
-- Name: blood_reserves_reserve_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.blood_reserves_reserve_id_seq', 6, true);


--
-- Name: bloodcenters_bloodcenter_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bloodcenters_bloodcenter_id_seq', 6, true);


--
-- Name: bloodrequests_bloodrequest_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bloodrequests_bloodrequest_id_seq', 9, true);


--
-- Name: donations_donation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.donations_donation_id_seq', 12, true);


--
-- Name: donor_calls_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.donor_calls_id_seq', 1, false);


--
-- Name: donors_donor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.donors_donor_id_seq', 7, true);


--
-- Name: email_verifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.email_verifications_id_seq', 65, true);


--
-- Name: medcenters_medcenter_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.medcenters_medcenter_id_seq', 16, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 30, true);


--
-- Name: admin_audit_logs admin_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: analyses analyses_donation_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analyses
    ADD CONSTRAINT analyses_donation_id_key UNIQUE (donation_id);


--
-- Name: analyses analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analyses
    ADD CONSTRAINT analyses_pkey PRIMARY KEY (analysis_id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (appointment_id);


--
-- Name: blood_reserves blood_reserves_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blood_reserves
    ADD CONSTRAINT blood_reserves_pkey PRIMARY KEY (reserve_id);


--
-- Name: bloodcenters bloodcenters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bloodcenters
    ADD CONSTRAINT bloodcenters_pkey PRIMARY KEY (bloodcenter_id);


--
-- Name: bloodcenters bloodcenters_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bloodcenters
    ADD CONSTRAINT bloodcenters_user_id_key UNIQUE (user_id);


--
-- Name: bloodrequests bloodrequests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bloodrequests
    ADD CONSTRAINT bloodrequests_pkey PRIMARY KEY (bloodrequest_id);


--
-- Name: donations donations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_pkey PRIMARY KEY (donation_id);


--
-- Name: donor_calls donor_calls_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donor_calls
    ADD CONSTRAINT donor_calls_pkey PRIMARY KEY (id);


--
-- Name: donors donors_iin_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donors
    ADD CONSTRAINT donors_iin_key UNIQUE (iin);


--
-- Name: donors donors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donors
    ADD CONSTRAINT donors_pkey PRIMARY KEY (donor_id);


--
-- Name: donors donors_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donors
    ADD CONSTRAINT donors_user_id_key UNIQUE (user_id);


--
-- Name: email_verifications email_verifications_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_email_key UNIQUE (email);


--
-- Name: email_verifications email_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_pkey PRIMARY KEY (id);


--
-- Name: medcenters medcenters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medcenters
    ADD CONSTRAINT medcenters_pkey PRIMARY KEY (medcenter_id);


--
-- Name: medcenters medcenters_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medcenters
    ADD CONSTRAINT medcenters_user_id_key UNIQUE (user_id);


--
-- Name: blood_reserves ukaopjiy523nke2tgxwbchefi6m; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blood_reserves
    ADD CONSTRAINT ukaopjiy523nke2tgxwbchefi6m UNIQUE (donation_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: idx_analyses_donation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_analyses_donation ON public.analyses USING btree (donation_id);


--
-- Name: idx_analyses_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_analyses_status ON public.analyses USING btree (status);


--
-- Name: idx_appointments_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_date ON public.appointments USING btree (appointment_date);


--
-- Name: idx_appointments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_status ON public.appointments USING btree (status);


--
-- Name: idx_bloodrequests_deadline; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bloodrequests_deadline ON public.bloodrequests USING btree (deadline);


--
-- Name: idx_bloodrequests_medcenter; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bloodrequests_medcenter ON public.bloodrequests USING btree (medcenter_id);


--
-- Name: idx_bloodrequests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bloodrequests_status ON public.bloodrequests USING btree (status);


--
-- Name: idx_donations_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_donations_date ON public.donations USING btree (donation_date);


--
-- Name: idx_donations_donor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_donations_donor_id ON public.donations USING btree (donor_id);


--
-- Name: idx_donations_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_donations_status ON public.donations USING btree (status);


--
-- Name: idx_donors_blood_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_donors_blood_group ON public.donors USING btree (blood_group, rhesus_factor);


--
-- Name: idx_donors_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_donors_city ON public.donors USING btree (city);


--
-- Name: idx_donors_donor_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_donors_donor_status ON public.donors USING btree (donor_status);


--
-- Name: idx_email_verifications_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_verifications_code ON public.email_verifications USING btree (verification_code);


--
-- Name: idx_email_verifications_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_verifications_email ON public.email_verifications USING btree (email);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: blood_reserves fk41uplylq94uyhce298k7ll7no; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blood_reserves
    ADD CONSTRAINT fk41uplylq94uyhce298k7ll7no FOREIGN KEY (blood_center_id) REFERENCES public.bloodcenters(bloodcenter_id);


--
-- Name: analyses fk_analysis_bloodcenter; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analyses
    ADD CONSTRAINT fk_analysis_bloodcenter FOREIGN KEY (blood_center_id) REFERENCES public.bloodcenters(bloodcenter_id);


--
-- Name: analyses fk_analysis_donation; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analyses
    ADD CONSTRAINT fk_analysis_donation FOREIGN KEY (donation_id) REFERENCES public.donations(donation_id) ON DELETE CASCADE;


--
-- Name: appointments fk_appointment_bloodcenter; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT fk_appointment_bloodcenter FOREIGN KEY (bloodcenter_id) REFERENCES public.bloodcenters(bloodcenter_id);


--
-- Name: appointments fk_appointment_donor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT fk_appointment_donor FOREIGN KEY (donor_id) REFERENCES public.donors(donor_id);


--
-- Name: bloodcenters fk_bloodcenter_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bloodcenters
    ADD CONSTRAINT fk_bloodcenter_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: bloodrequests fk_bloodrequest_bloodcenter; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bloodrequests
    ADD CONSTRAINT fk_bloodrequest_bloodcenter FOREIGN KEY (bloodcenter_id) REFERENCES public.bloodcenters(bloodcenter_id);


--
-- Name: bloodrequests fk_bloodrequest_medcenter; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bloodrequests
    ADD CONSTRAINT fk_bloodrequest_medcenter FOREIGN KEY (medcenter_id) REFERENCES public.medcenters(medcenter_id);


--
-- Name: donations fk_donation_analysis; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT fk_donation_analysis FOREIGN KEY (analysis_id) REFERENCES public.analyses(analysis_id);


--
-- Name: donations fk_donation_appointment; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT fk_donation_appointment FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id);


--
-- Name: donations fk_donation_bloodcenter; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT fk_donation_bloodcenter FOREIGN KEY (bloodcenter_id) REFERENCES public.bloodcenters(bloodcenter_id);


--
-- Name: donations fk_donation_donor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT fk_donation_donor FOREIGN KEY (donor_id) REFERENCES public.donors(donor_id);


--
-- Name: donors fk_donor_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donors
    ADD CONSTRAINT fk_donor_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: medcenters fk_medcenter_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medcenters
    ADD CONSTRAINT fk_medcenter_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: donor_calls fkk10d49nds0sd6tibyb0c2c96q; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donor_calls
    ADD CONSTRAINT fkk10d49nds0sd6tibyb0c2c96q FOREIGN KEY (blood_center_id) REFERENCES public.bloodcenters(bloodcenter_id);


--
-- PostgreSQL database dump complete
--

