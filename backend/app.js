const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

const ZOOM_CONNECTOR_UID = "zoom/skillswap-zoom-meetings";
const ZOOM_MEETING_SCOPES = ["meeting:write:meeting", "user:read"];

async function getZoomToken() {
    const { getToken } = await import("@vercel/connect");
    return getToken(
        ZOOM_CONNECTOR_UID,
        {
            subject: { type: "app" },
            scopes: ZOOM_MEETING_SCOPES
        }
    );
}

async function createZoomMeeting(swapId, senderId, receiverId) {
    const accessToken = await getZoomToken();
    const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            topic: `SkillSwap meeting #${swapId}`,
            type: 2,
            duration: 60,
            settings: {
                join_before_host: true,
                waiting_room: false,
                participant_video: true,
                host_video: true
            },
            agenda: `Private skill exchange between users ${senderId} and ${receiverId}`
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Zoom meeting creation failed");
    }

    return data;
}


// =====================================
// MIDDLEWARE
// =====================================

app.use(cors());
app.use(express.json());


// =====================================
// MYSQL CONNECTION
// =====================================

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "skill_swap"
});

db.connect((err) => {

    if (err) {
        console.log("❌ Database connection failed:");
        console.log(err.message);
        return;
    }

    console.log("✅ MySQL Connected Successfully");

});


// =====================================
// HOME
// =====================================

app.get("/", (req, res) => {

    res.json({
        message: "Skill Swap Management API is running"
    });

});


// =====================================
// REGISTER USER
// =====================================

app.post("/api/register", (req, res) => {

    const {
        name,
        email,
        phone,
        password
    } = req.body;

    if (!name || !email || !phone || !password) {

        return res.status(400).json({
            message: "All fields are required"
        });

    }

    const sql = `
        INSERT INTO users
        (name, email, phone, password)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [name, email, phone, password],
        (err, result) => {

            if (err) {

                console.log("Register Error:", err);

                if (err.code === "ER_DUP_ENTRY") {

                    return res.status(400).json({
                        message: "Email already registered"
                    });

                }

                return res.status(500).json({
                    message: "Registration failed",
                    error: err.message
                });

            }

            res.status(201).json({

                message: "Registration successful",
                user_id: result.insertId

            });

        }
    );

});


// =====================================
// LOGIN
// =====================================

app.post("/api/login", (req, res) => {

    const {
        email,
        password
    } = req.body;

    if (!email || !password) {

        return res.status(400).json({
            message: "Email and password are required"
        });

    }

    const sql = `
        SELECT
            user_id,
            name,
            email,
            phone
        FROM users
        WHERE email = ?
        AND password = ?
    `;

    db.query(
        sql,
        [email, password],
        (err, result) => {

            if (err) {

                console.log("Login Error:", err);

                return res.status(500).json({
                    message: "Login failed",
                    error: err.message
                });

            }

            if (result.length === 0) {

                return res.status(401).json({
                    message: "Invalid email or password"
                });

            }

            res.json({

                message: "Login successful",
                user: result[0]

            });

        }
    );

});


// =====================================
// GET ALL SKILLS
// =====================================

app.get("/api/skills", (req, res) => {

    const sql = `
        SELECT
            skill_id,
            skill_name
        FROM skills
        ORDER BY skill_name
    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.log("Skills Error:", err);

            return res.status(500).json({
                message: "Unable to load skills",
                error: err.message
            });

        }

        res.json(result);

    });

});


// =====================================
// ADD USER SKILL
// =====================================

app.post("/api/user-skills", (req, res) => {

    const {
        user_id,
        skill_id,
        skill_type
    } = req.body;

    if (!user_id || !skill_id || !skill_type) {

        return res.status(400).json({
            message: "user_id, skill_id and skill_type are required"
        });

    }

    if (
        skill_type !== "OFFER" &&
        skill_type !== "WANT"
    ) {

        return res.status(400).json({
            message: "skill_type must be OFFER or WANT"
        });

    }

    const sql = `
        INSERT INTO user_skills
        (user_id, skill_id, skill_type)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [user_id, skill_id, skill_type],
        (err, result) => {

            if (err) {

                console.log("Add Skill Error:", err);

                if (err.code === "ER_DUP_ENTRY") {

                    return res.status(400).json({
                        message: "You already added this skill with this type"
                    });

                }

                return res.status(500).json({
                    message: "Unable to add skill",
                    error: err.message
                });

            }

            res.status(201).json({

                message: "Skill added successfully",
                skill_id: result.insertId

            });

        }
    );

});


// =====================================
// GET USER SKILLS
// =====================================

app.get("/api/user-skills/:user_id", (req, res) => {

    const userId = req.params.user_id;

    const sql = `
        SELECT
            us.user_skill_id,
            us.user_id,
            us.skill_id,
            s.skill_name,
            us.skill_type
        FROM user_skills us
        JOIN skills s
            ON us.skill_id = s.skill_id
        WHERE us.user_id = ?
        ORDER BY us.skill_type, s.skill_name
    `;

    db.query(
        sql,
        [userId],
        (err, result) => {

            if (err) {

                console.log("User Skills Error:", err);

                return res.status(500).json({
                    message: "Unable to load your skills",
                    error: err.message
                });

            }

            res.json(result);

        }
    );

});


// =====================================
// FIND USERS WHO OFFER A SKILL
// =====================================

app.get("/api/find-skill/:skill_id", (req, res) => {

    const skillId = req.params.skill_id;

    const sql = `
        SELECT
            u.user_id,
            u.name,
            u.email,
            s.skill_name
        FROM user_skills us
        JOIN users u
            ON us.user_id = u.user_id
        JOIN skills s
            ON us.skill_id = s.skill_id
        WHERE us.skill_id = ?
        AND us.skill_type = 'OFFER'
    `;

    db.query(
        sql,
        [skillId],
        (err, result) => {

            if (err) {

                return res.status(500).json({
                    message: "Unable to find users",
                    error: err.message
                });

            }

            res.json(result);

        }
    );

});


// =====================================
// FIND MUTUAL MATCHES
// =====================================

app.get("/api/matches/:user_id", (req, res) => {

    const userId = req.params.user_id;

    const sql = `

        SELECT DISTINCT

            other_user.user_id,

            other_user.name,

            other_user.email,

            my_offer.skill_id AS my_offered_skill_id,

            my_offer_skill.skill_name AS my_offered_skill,

            my_want.skill_id AS my_wanted_skill_id,

            my_want_skill.skill_name AS my_wanted_skill,

            other_offer_skill.skill_name AS they_can_teach,

            other_want_skill.skill_name AS they_want_to_learn,

            my_offer.skill_id AS offered_skill_id,

            my_want.skill_id AS wanted_skill_id,

            other_offer.skill_id AS matched_offer_skill_id,

            other_want.skill_id AS matched_want_skill_id

        FROM user_skills my_want

        JOIN user_skills my_offer
            ON my_offer.user_id = my_want.user_id
            AND my_offer.skill_type = 'OFFER'

        JOIN user_skills other_offer
            ON other_offer.skill_id = my_want.skill_id
            AND other_offer.skill_type = 'OFFER'

        JOIN user_skills other_want
            ON other_want.user_id = other_offer.user_id
            AND other_want.skill_id = my_offer.skill_id
            AND other_want.skill_type = 'WANT'

        JOIN users other_user
            ON other_user.user_id = other_offer.user_id

        JOIN skills my_offer_skill
            ON my_offer_skill.skill_id = my_offer.skill_id

        JOIN skills my_want_skill
            ON my_want_skill.skill_id = my_want.skill_id

        JOIN skills other_offer_skill
            ON other_offer_skill.skill_id = other_offer.skill_id

        JOIN skills other_want_skill
            ON other_want_skill.skill_id = other_want.skill_id

        WHERE my_want.user_id = ?
        AND my_want.skill_type = 'WANT'
        AND other_user.user_id <> ?

    `;

    db.query(
        sql,
        [userId, userId],
        (err, result) => {

            if (err) {

                console.log("Match Error:", err);

                return res.status(500).json({
                    message: "Unable to find matches",
                    error: err.message
                });

            }

            res.json(result);

        }
    );

});


// =====================================
// SEND SWAP REQUEST
// =====================================

app.post("/api/swap-request", (req, res) => {

    const {
        requester_id,
        receiver_id,
        offered_skill_id,
        requested_skill_id
    } = req.body;

    if (
        !requester_id ||
        !receiver_id ||
        !offered_skill_id ||
        !requested_skill_id
    ) {

        return res.status(400).json({
            message: "All swap request fields are required"
        });

    }

    if (requester_id == receiver_id) {

        return res.status(400).json({
            message: "You cannot send a request to yourself"
        });

    }


    // =====================================
    // VALIDATE MUTUAL MATCH
    // =====================================

    const validationSql = `

        SELECT

            (
                SELECT COUNT(*)
                FROM user_skills
                WHERE user_id = ?
                AND skill_id = ?
                AND skill_type = 'OFFER'
            ) AS requester_offer,

            (
                SELECT COUNT(*)
                FROM user_skills
                WHERE user_id = ?
                AND skill_id = ?
                AND skill_type = 'WANT'
            ) AS requester_want,

            (
                SELECT COUNT(*)
                FROM user_skills
                WHERE user_id = ?
                AND skill_id = ?
                AND skill_type = 'OFFER'
            ) AS receiver_offer,

            (
                SELECT COUNT(*)
                FROM user_skills
                WHERE user_id = ?
                AND skill_id = ?
                AND skill_type = 'WANT'
            ) AS receiver_want

    `;

    db.query(

        validationSql,

        [
            requester_id,
            offered_skill_id,

            requester_id,
            requested_skill_id,

            receiver_id,
            requested_skill_id,

            receiver_id,
            offered_skill_id
        ],

        (err, result) => {

            if (err) {

                console.log("Validation Error:", err);

                return res.status(500).json({
                    message: "Unable to validate skill match",
                    error: err.message
                });

            }

            const validation = result[0];

            if (
                Number(validation.requester_offer) === 0 ||
                Number(validation.requester_want) === 0 ||
                Number(validation.receiver_offer) === 0 ||
                Number(validation.receiver_want) === 0
            ) {

                return res.status(400).json({
                    message: "This is not a valid mutual skill match"
                });

            }


            // =====================================
            // CHECK DUPLICATE PENDING REQUEST
            // =====================================

            const duplicateSql = `

                SELECT swap_id
                FROM swap_requests
                WHERE sender_id = ?
                AND receiver_id = ?
                AND offered_skill_id = ?
                AND requested_skill_id = ?
                AND swap_status = 'Pending'

            `;

            db.query(

                duplicateSql,

                [
                    requester_id,
                    receiver_id,
                    offered_skill_id,
                    requested_skill_id
                ],

                (err, duplicateResult) => {

                    if (err) {

                        console.log("Duplicate Check Error:", err);

                        return res.status(500).json({
                            message: "Unable to check existing request",
                            error: err.message
                        });

                    }

                    if (duplicateResult.length > 0) {

                        return res.status(400).json({
                            message: "Swap request already sent"
                        });

                    }


                    // =====================================
                    // INSERT REQUEST
                    // =====================================

                    const insertSql = `

                        INSERT INTO swap_requests

                        (
                            sender_id,
                            receiver_id,
                            offered_skill_id,
                            requested_skill_id,
                            swap_status
                        )

                        VALUES (?, ?, ?, ?, 'Pending')

                    `;

                    db.query(

                        insertSql,

                        [
                            requester_id,
                            receiver_id,
                            offered_skill_id,
                            requested_skill_id
                        ],

                        (err, result) => {

                            if (err) {

                                console.log("Insert Request Error:", err);

                                return res.status(500).json({
                                    message: "Unable to send swap request",
                                    error: err.message
                                });

                            }

                            res.status(201).json({

                                message: "Swap request sent successfully",

                                swap_id: result.insertId

                            });

                        }
                    );

                }
            );

        }
    );

});


// =====================================
// GET RECEIVED SWAP REQUESTS
// =====================================

app.get("/api/requests/:user_id", (req, res) => {

    const userId = req.params.user_id;

    const sql = `

        SELECT

            sr.swap_id,

            sr.sender_id,

            sr.receiver_id,

            sr.offered_skill_id,

            sr.requested_skill_id,

            sr.swap_date,

            sr.swap_status,

            sender.name AS sender_name,

            sender.email AS sender_email,

            offered_skill.skill_name AS offered_skill,

            requested_skill.skill_name AS requested_skill

        FROM swap_requests sr

        JOIN users sender
            ON sender.user_id = sr.sender_id

        JOIN skills offered_skill
            ON offered_skill.skill_id = sr.offered_skill_id

        JOIN skills requested_skill
            ON requested_skill.skill_id = sr.requested_skill_id

        WHERE sr.receiver_id = ?

        ORDER BY sr.swap_id DESC

    `;

    db.query(

        sql,

        [userId],

        (err, result) => {

            if (err) {

                console.log("Request Load Error:", err);

                return res.status(500).json({
                    message: "Unable to load requests",
                    error: err.message
                });

            }

            res.json(result);

        }
    );

});


// =====================================
// ACCEPT SWAP REQUEST
// =====================================

app.put(
    "/api/swap-request/:swap_id/accept",
    (req, res) => {

        const swapId = req.params.swap_id;


        // =====================================
        // GET REQUEST
        // =====================================

        const getRequestSql = `

            SELECT *

            FROM swap_requests

            WHERE swap_id = ?

        `;

        db.query(

            getRequestSql,

            [swapId],

            (err, result) => {

                if (err) {

                    console.log("Get Request Error:", err);

                    return res.status(500).json({
                        message: "Unable to find request",
                        error: err.message
                    });

                }

                if (result.length === 0) {

                    return res.status(404).json({
                        message: "Swap request not found"
                    });

                }

                const request = result[0];


                // =====================================
                // CHECK STATUS
                // =====================================

                if (
                    request.swap_status.toLowerCase() !== "pending"
                ) {

                    return res.status(400).json({
                        message: "This request has already been processed"
                    });

                }


                // =====================================
                // UPDATE STATUS
                // =====================================

                const updateSql = `

                    UPDATE swap_requests

                    SET swap_status = 'Accepted'

                    WHERE swap_id = ?

                    AND swap_status = 'Pending'

                `;

                db.query(

                    updateSql,

                    [swapId],

                    (err, updateResult) => {

                        if (err) {

                            console.log("Accept Error:", err);

                            return res.status(500).json({
                                message: "Unable to accept request",
                                error: err.message
                            });

                        }

                        if (updateResult.affectedRows === 0) {

                            return res.status(400).json({
                                message: "Request already processed"
                            });

                        }


                        createZoomMeeting(
                            request.swap_id,
                            request.sender_id,
                            request.receiver_id
                        )
                            .then((meeting) => {
                                const meetingSql = `
                                    UPDATE swap_requests
                                    SET zoom_meeting_id = ?,
                                        zoom_join_url = ?,
                                        zoom_start_url = ?,
                                        zoom_password = ?,
                                        zoom_start_time = ?,
                                        zoom_duration = ?
                                    WHERE swap_id = ?
                                `;

                                db.query(
                                    meetingSql,
                                    [
                                        String(meeting.id),
                                        meeting.join_url,
                                        meeting.start_url,
                                        meeting.password || null,
                                        meeting.start_time ? new Date(meeting.start_time) : null,
                                        meeting.duration || 60,
                                        request.swap_id
                                    ],
                                    (meetingError) => {
                                        if (meetingError) {
                                            console.log("Zoom Meeting Save Error:", meetingError);
                                            return res.status(500).json({
                                                message: "Request accepted, but the Zoom meeting could not be saved",
                                                error: meetingError.message
                                            });
                                        }

                                        res.json({
                                            message: "Swap accepted and Zoom meeting created",
                                            swap_id: request.swap_id,
                                            meeting: {
                                                join_url: meeting.join_url,
                                                start_time: meeting.start_time,
                                                duration: meeting.duration
                                            }
                                        });
                                    }
                                );
                            })
                            .catch((zoomError) => {
                                console.log("Zoom Meeting Error:", zoomError);
                                res.status(502).json({
                                    message: "Request was accepted, but Zoom meeting creation failed",
                                    error: zoomError.message
                                });
                            });

                    }
                );

            }
        );

    }
);


// =====================================
// REJECT SWAP REQUEST
// =====================================

app.put(
    "/api/swap-request/:swap_id/reject",
    (req, res) => {

        const swapId = req.params.swap_id;

        const sql = `

            UPDATE swap_requests

            SET swap_status = 'Rejected'

            WHERE swap_id = ?

            AND swap_status = 'Pending'

        `;

        db.query(

            sql,

            [swapId],

            (err, result) => {

                if (err) {

                    console.log("Reject Error:", err);

                    return res.status(500).json({
                        message: "Unable to reject request",
                        error: err.message
                    });

                }

                if (result.affectedRows === 0) {

                    return res.status(400).json({
                        message:
                            "Request not found or already processed"
                    });

                }

                res.json({

                    message: "Swap request rejected"

                });

            }
        );

    }
);


// =====================================
// GET ACTIVE SWAPS
// =====================================

/*
    IMPORTANT:

    Your database currently has only:

    swap_requests

    and does NOT have:

    swaps

    Therefore we use ACCEPTED records from
    swap_requests as active swaps.
*/

app.get("/api/swaps/:user_id", (req, res) => {

    const userId = req.params.user_id;

    const sql = `

        SELECT

            sr.swap_id,

            sr.sender_id,

            sr.receiver_id,

            sr.offered_skill_id,

            sr.requested_skill_id,

            sr.swap_date,

            sr.swap_status,
            sr.zoom_meeting_id,
            sr.zoom_join_url,
            sr.zoom_password,
            sr.zoom_start_time,
            sr.zoom_duration,

            CASE

                WHEN sr.sender_id = ?

                THEN receiver.name

                ELSE sender.name

            END AS partner_name,

            CASE

                WHEN sr.sender_id = ?

                THEN offered_skill.skill_name

                ELSE requested_skill.skill_name

            END AS your_skill,

            CASE

                WHEN sr.sender_id = ?

                THEN requested_skill.skill_name

                ELSE offered_skill.skill_name

            END AS partner_skill

        FROM swap_requests sr

        JOIN users sender
            ON sender.user_id = sr.sender_id

        JOIN users receiver
            ON receiver.user_id = sr.receiver_id

        JOIN skills offered_skill
            ON offered_skill.skill_id = sr.offered_skill_id

        JOIN skills requested_skill
            ON requested_skill.skill_id = sr.requested_skill_id

        WHERE
            (
                sr.sender_id = ?
                OR
                sr.receiver_id = ?
            )

        AND sr.swap_status = 'Accepted'

        ORDER BY sr.swap_id DESC

    `;

    db.query(

        sql,

        [
            userId,
            userId,
            userId,
            userId,
            userId
        ],

        (err, result) => {

            if (err) {

                console.log("Swaps Error:", err);

                return res.status(500).json({
                    message: "Unable to load active swaps",
                    error: err.message
                });

            }

            res.json(result);

        }
    );

});


// =====================================
// COMPLETE SWAP
// =====================================

app.put(
    "/api/swaps/:swap_id/complete",
    (req, res) => {

        const swapId = req.params.swap_id;

        const sql = `

            UPDATE swap_requests

            SET swap_status = 'Completed'

            WHERE swap_id = ?

            AND swap_status = 'Accepted'

        `;

        db.query(

            sql,

            [swapId],

            (err, result) => {

                if (err) {

                    console.log("Complete Swap Error:", err);

                    return res.status(500).json({
                        message: "Unable to complete swap",
                        error: err.message
                    });

                }

                if (result.affectedRows === 0) {

                    return res.status(400).json({
                        message:
                            "Swap not found or already completed"
                    });

                }

                res.json({

                    message:
                        "Swap completed successfully"

                });

            }
        );

    }
);


// =====================================
// SERVER
// =====================================

const PORT = 5000;

app.listen(PORT, () => {

    console.log(
        `🚀 Server running at http://localhost:${PORT}`
    );

});
