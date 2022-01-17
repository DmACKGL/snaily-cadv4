import { UPDATE_OFFICER_SCHEMA } from "@snailycad/schemas";
import { PathParams, BodyParams, Context } from "@tsed/common";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { Get, Put } from "@tsed/schema";
import {
  linkDivisionsToOfficer,
  unlinkDivisionsFromOfficer,
  validateMaxDivisionsPerOfficer,
} from "controllers/leo/LeoController";
import { leoProperties, unitProperties } from "lib/officer";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { IsAuth } from "middlewares/index";
import { Socket } from "services/SocketService";

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/units")
export class ManageUnitsController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  async getUnits() {
    const units = await Promise.all([
      (
        await prisma.officer.findMany({ include: leoProperties })
      ).map((v) => ({ ...v, type: "OFFICER" })),
      (
        await prisma.emsFdDeputy.findMany({ include: unitProperties })
      ).map((v) => ({ ...v, type: "DEPUTY" })),
    ]);

    return units.flat(1);
  }

  @Get("/:id")
  async getUnit(@PathParams("id") id: string) {
    let unit: any = await prisma.officer.findUnique({
      where: { id },
      include: { ...leoProperties, logs: true },
    });

    if (!unit) {
      unit = await prisma.emsFdDeputy.findUnique({
        where: { id },
        include: unitProperties,
      });
    }

    if (!unit) {
      throw new NotFound("unitNotFound");
    }

    return unit;
  }

  @Put("/off-duty")
  async setSelectedOffDuty(@BodyParams("ids") ids: string[]) {
    const updated = await Promise.all(
      ids.map(async (fullId) => {
        const [id, rawType] = fullId.split("-");
        const type = rawType === "OFFICER" ? "officer" : "emsFdDeputy";

        if (rawType === "OFFICER") {
          const log = await prisma.officerLog.findFirst({
            where: {
              endedAt: null,
              officerId: id,
            },
          });

          if (log) {
            await prisma.officerLog.update({
              where: { id: log.id },
              data: { endedAt: new Date() },
            });
          }
        }

        // @ts-expect-error ignore
        return prisma[type].update({
          where: { id },
          data: {
            statusId: null,
          },
        });
      }),
    );

    this.socket.emitUpdateDeputyStatus();
    this.socket.emitUpdateOfficerStatus();

    return updated;
  }

  @Put("/:id")
  async updateUnit(
    @PathParams("id") id: string,
    @BodyParams() body: unknown,
    @Context("cad") cad: any,
  ) {
    const data = validateSchema(UPDATE_OFFICER_SCHEMA, body);

    let type: "officer" | "emsFdDeputy" = "officer";
    let unit: any = await prisma.officer.findUnique({
      where: { id },
      include: leoProperties,
    });

    if (!unit) {
      type = "emsFdDeputy";
      unit = await prisma.emsFdDeputy.findUnique({
        where: { id },
        include: unitProperties,
      });
    }

    if (!unit) {
      throw new NotFound("unitNotFound");
    }

    if (type === "officer") {
      await validateMaxDivisionsPerOfficer(data.divisions, cad);

      await unlinkDivisionsFromOfficer(unit);
    }

    // @ts-expect-error ignore
    const updated = await prisma[type].update({
      where: { id: unit.id },
      data: {
        statusId: data.status,
        departmentId: data.department,
        divisionId: data.division,
        rankId: data.rank || null,
        suspended: data.suspended,
      },
    });

    if (type === "officer") {
      return linkDivisionsToOfficer(unit, data.divisions as string[]);
    }

    return updated;
  }
}
