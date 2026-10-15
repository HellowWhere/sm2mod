package com.example.sm2mod;

import java.util.EnumMap;
import java.util.Map;

import net.minecraft.client.Minecraft;
import net.minecraft.client.model.HumanoidModel;
import net.minecraft.client.model.geom.ModelLayerLocation;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.entity.EquipmentSlot;

/** Client-only helper: model layer locations and cached baked armor models. */
public final class PowerArmorClient {
    public static final EquipmentSlot[] SLOTS = {EquipmentSlot.HEAD, EquipmentSlot.CHEST, EquipmentSlot.LEGS, EquipmentSlot.FEET};
    private static final Map<EquipmentSlot, ModelLayerLocation> LAYERS = new EnumMap<>(EquipmentSlot.class);
    private static final Map<EquipmentSlot, PowerArmorModel> CACHE = new EnumMap<>(EquipmentSlot.class);

    static {
        for (EquipmentSlot slot : SLOTS) {
            LAYERS.put(slot, new ModelLayerLocation(new ResourceLocation(Sm2Mod.MODID, "power_armor_" + slot.getName()), "main"));
        }
    }

    private PowerArmorClient() {
    }

    public static ModelLayerLocation layer(EquipmentSlot slot) {
        return LAYERS.get(slot);
    }

    public static HumanoidModel<?> model(EquipmentSlot slot) {
        PowerArmorModel model = CACHE.get(slot);
        if (model == null) {
            model = new PowerArmorModel(Minecraft.getInstance().getEntityModels().bakeLayer(LAYERS.get(slot)));
            CACHE.put(slot, model);
        }
        return model;
    }
}
