package com.example.sm2mod;

import net.minecraft.sounds.SoundEvent;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.world.item.ArmorItem;
import net.minecraft.world.item.ArmorMaterial;
import net.minecraft.world.item.Items;
import net.minecraft.world.item.crafting.Ingredient;

public class PowerArmorMaterial implements ArmorMaterial {
    public static final PowerArmorMaterial INSTANCE = new PowerArmorMaterial();
    private static final int[] DURABILITY = {481, 704, 660, 572}; // boots, leggings, chest, helmet
    private static final int[] DEFENSE = {3, 6, 8, 3};

    @Override public int getDurabilityForType(ArmorItem.Type type) { return DURABILITY[type.ordinal()]; }
    @Override public int getDefenseForType(ArmorItem.Type type) { return DEFENSE[type.ordinal()]; }
    @Override public int getEnchantmentValue() { return 12; }
    @Override public SoundEvent getEquipSound() { return SoundEvents.ARMOR_EQUIP_NETHERITE; }
    @Override public Ingredient getRepairIngredient() { return Ingredient.of(Items.NETHERITE_INGOT); }
    @Override public String getName() { return Sm2Mod.MODID + ":power_armor"; }
    @Override public float getToughness() { return 3.0F; }
    @Override public float getKnockbackResistance() { return 0.2F; }
}
