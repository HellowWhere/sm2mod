package com.example.sm2mod;

import net.minecraft.client.model.HumanoidModel;
import net.minecraft.client.model.geom.ModelPart;
import net.minecraft.client.model.geom.PartPose;
import net.minecraft.client.model.geom.builders.CubeListBuilder;
import net.minecraft.client.model.geom.builders.LayerDefinition;
import net.minecraft.client.model.geom.builders.MeshDefinition;
import net.minecraft.client.model.geom.builders.PartDefinition;
import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.entity.LivingEntity;

/**
 * Volumetric Space Marine power armor. One model per slot (only that slot's geometry is present).
 * Texture: 256x256, a 4x4 grid of flat colour cells (64x64 each); every box uses one cell.
 */
public class PowerArmorModel extends HumanoidModel<LivingEntity> {
    // colour cells
    private static final int BLUE = 4, DBLUE = 14, GOLD = 3, DARK = 0,
            RED = 7, GUN = 1, GREY = 13, STEEL = 2;

    private static int counter = 0;

    public PowerArmorModel(ModelPart root) {
        super(root);
    }

    /** Adds one coloured box to a part. */
    private static void box(PartDefinition part, int color, float x, float y, float z, float w, float h, float d) {
        part.addOrReplaceChild("b" + (counter++),
                CubeListBuilder.create().texOffs((color % 4) * 64, (color / 4) * 64).addBox(x, y, z, w, h, d),
                PartPose.ZERO);
    }

    /** Same, but mirrored around x = 0 when {@code mirror} is true (for left-side parts). */
    private static void mbox(PartDefinition part, boolean mirror, int color, float x, float y, float z, float w, float h, float d) {
        box(part, color, mirror ? -(x + w) : x, y, z, w, h, d);
    }

    public static LayerDefinition create(EquipmentSlot slot) {
        MeshDefinition mesh = new MeshDefinition();
        PartDefinition root = mesh.getRoot();
        PartDefinition head = root.addOrReplaceChild("head", CubeListBuilder.create(), PartPose.ZERO);
        root.addOrReplaceChild("hat", CubeListBuilder.create(), PartPose.ZERO);
        PartDefinition body = root.addOrReplaceChild("body", CubeListBuilder.create(), PartPose.ZERO);
        PartDefinition rightArm = root.addOrReplaceChild("right_arm", CubeListBuilder.create(), PartPose.offset(-5.0F, 2.0F, 0.0F));
        PartDefinition leftArm = root.addOrReplaceChild("left_arm", CubeListBuilder.create(), PartPose.offset(5.0F, 2.0F, 0.0F));
        PartDefinition rightLeg = root.addOrReplaceChild("right_leg", CubeListBuilder.create(), PartPose.offset(-1.9F, 12.0F, 0.0F));
        PartDefinition leftLeg = root.addOrReplaceChild("left_leg", CubeListBuilder.create(), PartPose.offset(1.9F, 12.0F, 0.0F));

        switch (slot) {
            case HEAD -> helmet(head);
            case CHEST -> {
                chest(body);
                arm(rightArm, false);
                arm(leftArm, true);
            }
            case LEGS -> {
                belt(body);
                thigh(rightLeg);
                thigh(leftLeg);
            }
            case FEET -> {
                boot(rightLeg);
                boot(leftLeg);
            }
            default -> {
            }
        }
        return LayerDefinition.create(mesh, 256, 256);
    }

    // ---------------- helmet (Mark X style) ----------------
    private static void helmet(PartDefinition p) {
        box(p, BLUE, -4.5F, -8.6F, -4.5F, 9.0F, 8.8F, 9.0F);          // main shell
        box(p, GOLD, -4.8F, -9.0F, -4.8F, 9.6F, 0.8F, 9.6F);          // top trim ring
        box(p, RED, -0.6F, -10.8F, -3.6F, 1.2F, 2.2F, 7.2F);          // crest
        box(p, GREY, -2.6F, -3.2F, -5.3F, 5.2F, 3.2F, 0.9F);          // faceplate grille
        box(p, DARK, -1.6F, -2.8F, -5.5F, 3.2F, 0.6F, 0.4F);          // grille slits
        box(p, DARK, -1.6F, -1.6F, -5.5F, 3.2F, 0.6F, 0.4F);
        box(p, RED, -3.8F, -6.2F, -5.1F, 2.6F, 1.3F, 0.7F);           // eye lenses
        box(p, RED, 1.2F, -6.2F, -5.1F, 2.6F, 1.3F, 0.7F);
        box(p, GUN, -4.9F, -4.0F, -4.9F, 9.8F, 1.0F, 1.0F);           // brow/cheek band
        box(p, GUN, -5.4F, -6.5F, -1.6F, 1.0F, 4.2F, 3.2F);           // ear guards
        box(p, GUN, 4.4F, -6.5F, -1.6F, 1.0F, 4.2F, 3.2F);
        box(p, GOLD, -5.5F, -5.4F, -0.6F, 0.4F, 1.6F, 1.2F);          // ear emblems
        box(p, GOLD, 5.1F, -5.4F, -0.6F, 0.4F, 1.6F, 1.2F);
        box(p, DARK, -2.2F, -3.4F, 4.4F, 4.4F, 2.6F, 0.9F);           // rear vents
        box(p, GUN, -3.6F, -0.6F, -4.9F, 7.2F, 1.2F, 9.8F);           // gorget ring
    }

    // ---------------- chest + backpack ----------------
    private static void chest(PartDefinition p) {
        box(p, BLUE, -4.8F, -0.5F, -2.8F, 9.6F, 10.0F, 5.6F);         // torso shell
        box(p, BLUE, -4.1F, 0.4F, -3.7F, 8.2F, 6.2F, 1.0F);           // breastplate
        box(p, GOLD, -1.6F, 1.8F, -4.1F, 3.2F, 3.4F, 0.5F);           // aquila body
        box(p, GOLD, -3.8F, 2.6F, -4.1F, 7.6F, 0.9F, 0.5F);           // aquila wings
        box(p, GOLD, -2.6F, 3.5F, -4.1F, 5.2F, 0.7F, 0.5F);
        box(p, RED, -0.5F, 3.0F, -4.3F, 1.0F, 1.0F, 0.3F);            // gem
        box(p, GUN, -3.4F, -1.5F, -2.8F, 6.8F, 1.4F, 5.6F);           // collar
        box(p, GOLD, -4.9F, 6.7F, -3.0F, 9.8F, 0.6F, 0.5F);           // lower plate trim
        box(p, DARK, -3.8F, 9.5F, -2.5F, 7.6F, 2.6F, 5.0F);           // abdomen
        box(p, GOLD, -1.0F, 9.7F, -3.0F, 2.0F, 2.0F, 0.6F);           // belt buckle
        box(p, GUN, -3.6F, 0.4F, 2.8F, 7.2F, 8.2F, 2.8F);             // backpack
        box(p, BLUE, -3.2F, 0.8F, 5.6F, 6.4F, 3.0F, 0.6F);            // backpack plate
        box(p, DARK, -2.8F, 8.6F, 3.6F, 1.8F, 2.6F, 1.8F);            // exhausts
        box(p, DARK, 1.0F, 8.6F, 3.6F, 1.8F, 2.6F, 1.8F);
        box(p, RED, -2.4F, 8.4F, 4.0F, 1.0F, 0.4F, 1.0F);
        box(p, RED, 1.4F, 8.4F, 4.0F, 1.0F, 0.4F, 1.0F);
    }

    private static void arm(PartDefinition p, boolean left) {
        // pauldron (domed, gold trimmed)
        mbox(p, left, BLUE, -5.6F, -2.8F, -3.7F, 7.6F, 3.4F, 7.4F);
        mbox(p, left, BLUE, -5.0F, -3.9F, -3.1F, 6.4F, 1.3F, 6.2F);
        mbox(p, left, GOLD, -5.8F, 0.6F, -3.9F, 7.8F, 0.7F, 7.8F);
        mbox(p, left, GOLD, -5.95F, -1.8F, -1.2F, 0.4F, 2.2F, 2.4F);   // chapter badge
        mbox(p, left, RED, -6.0F, -1.2F, -0.5F, 0.3F, 1.0F, 1.0F);
        // upper arm, elbow, vambrace, gauntlet
        mbox(p, left, DBLUE, -3.6F, 1.3F, -2.6F, 5.2F, 3.6F, 5.2F);
        mbox(p, left, BLUE, -3.9F, 4.6F, -2.9F, 5.8F, 1.8F, 5.8F);
        mbox(p, left, GOLD, -3.95F, 4.4F, -2.95F, 5.9F, 0.4F, 5.9F);
        mbox(p, left, BLUE, -3.7F, 6.4F, -2.7F, 5.4F, 3.0F, 5.4F);
        mbox(p, left, DARK, -3.6F, 9.2F, -2.6F, 5.2F, 2.2F, 5.2F);
    }

    // ---------------- leggings ----------------
    private static void belt(PartDefinition p) {
        box(p, DARK, -4.7F, 9.4F, -2.7F, 9.4F, 3.0F, 5.4F);           // waist guard
        box(p, GOLD, -1.2F, 9.7F, -3.2F, 2.4F, 2.2F, 0.6F);           // buckle
        box(p, BLUE, -5.5F, 10.0F, -2.2F, 1.0F, 3.4F, 4.4F);          // hip plates
        box(p, BLUE, 4.5F, 10.0F, -2.2F, 1.0F, 3.4F, 4.4F);
        box(p, GUN, -1.6F, 12.2F, -3.0F, 3.2F, 2.4F, 0.8F);           // codpiece plate
    }

    private static void thigh(PartDefinition p) {
        box(p, BLUE, -2.7F, -0.6F, -2.7F, 5.4F, 5.6F, 5.4F);          // thigh
        box(p, GOLD, -2.8F, 4.8F, -3.4F, 5.6F, 0.5F, 6.8F);           // knee trim
        box(p, BLUE, -2.7F, 5.2F, -3.3F, 5.4F, 2.4F, 1.1F);           // knee guard
        box(p, GOLD, -1.0F, 5.6F, -3.6F, 2.0F, 1.6F, 0.4F);           // knee emblem
        box(p, BLUE, -2.6F, 7.0F, -2.6F, 5.2F, 3.2F, 5.2F);           // shin
    }

    // ---------------- boots ----------------
    private static void boot(PartDefinition p) {
        box(p, BLUE, -2.7F, 8.8F, -2.7F, 5.4F, 3.2F, 5.4F);           // shaft
        box(p, GOLD, -2.9F, 8.6F, -2.9F, 5.8F, 0.6F, 5.8F);           // top trim
        box(p, BLUE, -2.7F, 10.8F, -4.6F, 5.4F, 1.2F, 2.2F);          // toe cap
        box(p, DARK, -2.9F, 11.4F, -4.8F, 5.8F, 0.6F, 8.4F);          // sole
    }
}
