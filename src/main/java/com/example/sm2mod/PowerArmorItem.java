package com.example.sm2mod;

import java.util.function.Consumer;

import net.minecraft.client.model.HumanoidModel;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.item.ArmorItem;
import net.minecraft.world.item.ArmorMaterial;
import net.minecraft.world.item.ItemStack;
import net.minecraftforge.client.extensions.common.IClientItemExtensions;

public class PowerArmorItem extends ArmorItem {
    public PowerArmorItem(ArmorMaterial material, ArmorItem.Type type, Properties props) {
        super(material, type, props);
    }

    @Override
    public String getArmorTexture(ItemStack stack, Entity entity, EquipmentSlot slot, String type) {
        return Sm2Mod.MODID + ":textures/models/armor/power_armor_model.png";
    }

    @Override
    public void initializeClient(Consumer<IClientItemExtensions> consumer) {
        consumer.accept(new IClientItemExtensions() {
            @Override
            public HumanoidModel<?> getHumanoidArmorModel(LivingEntity entity, ItemStack stack, EquipmentSlot slot,
                                                          HumanoidModel<?> original) {
                return PowerArmorClient.model(slot);
            }
        });
    }
}
