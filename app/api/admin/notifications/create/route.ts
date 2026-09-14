// app/api/admin/notifications/create/route.ts

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Notification, {
  NOTIFICATION_TYPES,
  NOTIFICATION_ACTION_TYPES,
  NOTIFICATION_ACTION_ENTITIES,
  NotificationType,
  NotificationActionType,
  NotificationActionEntity,
} from "@/models/Notification";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    console.log("📨 Creating notification...");

    await dbConnect();

    // ========================================================
    // AUTHENTICATION
    // ========================================================
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - No token provided",
        },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Invalid token",
        },
        { status: 401 }
      );
    }

    let decoded: {
      userId: string;
      role: string;
    };

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret"
      ) as {
        userId: string;
        role: string;
      };
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid token",
        },
        { status: 401 }
      );
    }

    if (decoded.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden - Admin access required",
        },
        { status: 403 }
      );
    }

    // ========================================================
    // REQUEST BODY
    // ========================================================
    const body = await request.json();

    console.log(
      "📦 Request body:",
      JSON.stringify(body, null, 2)
    );

    const {
      hospitalId,
      subject,
      message,
      type,
      category,
      sender,
      link,
      action,
      data,
    } = body;

    // ========================================================
    // REQUIRED FIELDS
    // ========================================================
    if (!hospitalId || !subject || !message) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: hospitalId, subject, message",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // VALIDATE NOTIFICATION TYPE
    // ========================================================
    const notificationType =
      type as NotificationType;

    if (
      !NOTIFICATION_TYPES.includes(
        notificationType
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid notification type: ${type}`,
          allowedTypes: NOTIFICATION_TYPES,
        },
        { status: 400 }
      );
    }

    // ========================================================
    // VALIDATE CATEGORY
    // ========================================================
    const allowedCategories = [
      "info",
      "success",
      "warning",
      "error",
    ] as const;

    const notificationCategory =
      category || "info";

    if (
      !allowedCategories.includes(
        notificationCategory
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid notification category: ${category}`,
          allowedCategories,
        },
        { status: 400 }
      );
    }

    // ========================================================
    // BUILD NOTIFICATION
    // ========================================================
    const notificationData: any = {
      userId: hospitalId,
      hospitalId,
      subject,
      message,

      // IMPORTANT:
      // This is now guaranteed to be one of the enum values.
      type: notificationType,

      category: notificationCategory,

      sender: sender || "RedPulse System",

      link: link || undefined,

      isRead: false,
      isDeleted: false,
    };

    // ========================================================
    // ACTION
    // ========================================================
    if (action) {
      const actionType =
        action.type as NotificationActionType;

      const actionEntity =
        action.entity as NotificationActionEntity;

      if (
        !NOTIFICATION_ACTION_TYPES.includes(
          actionType
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid action type: ${action.type}`,
            allowedActionTypes:
              NOTIFICATION_ACTION_TYPES,
          },
          { status: 400 }
        );
      }

      if (
        !NOTIFICATION_ACTION_ENTITIES.includes(
          actionEntity
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid action entity: ${action.entity}`,
            allowedEntities:
              NOTIFICATION_ACTION_ENTITIES,
          },
          { status: 400 }
        );
      }

      notificationData.action = {
        type: actionType,
        id: String(action.id || ""),
        entity: actionEntity,

        bloodType:
          action.bloodType || undefined,

        units:
          typeof action.units === "number"
            ? action.units
            : undefined,

        minRequired:
          typeof action.minRequired === "number"
            ? action.minRequired
            : undefined,

        hospitalName:
          action.hospitalName || undefined,

        severity:
          action.severity || undefined,
      };
    }

    // ========================================================
    // DATA
    // ========================================================
    if (data) {
      notificationData.data = data;
    }

    console.log(
      "📝 Creating notification:",
      JSON.stringify(
        notificationData,
        null,
        2
      )
    );

    // ========================================================
    // CREATE
    // ========================================================
    const notification =
      await Notification.create(
        notificationData
      );

    console.log(
      "✅ Notification created:",
      notification._id.toString()
    );

    return NextResponse.json(
      {
        success: true,
        data: notification,
        message:
          "Notification created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      "❌ Error creating notification:",
      error
    );

    // ========================================================
    // JWT ERROR
    // ========================================================
    if (
      error?.name === "JsonWebTokenError"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid token",
        },
        { status: 401 }
      );
    }

    // ========================================================
    // MONGOOSE VALIDATION ERROR
    // ========================================================
    if (
      error?.name === "ValidationError"
    ) {
      const messages = Object.values(
        error.errors || {}
      )
        .map(
          (e: any) => e.message
        )
        .join(", ");

      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${messages}`,
        },
        { status: 400 }
      );
    }

    // ========================================================
    // GENERAL ERROR
    // ========================================================
    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to create notification",
      },
      { status: 500 }
    );
  }
}